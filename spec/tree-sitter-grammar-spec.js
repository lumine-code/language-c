const { Point } = require("lumine");
const fs = require("fs");
const path = require("path");

const sharedHighlightsPath = path.join(__dirname, "..", "grammars", "c-shared-highlights.scm");
const cppHighlightsPath = path.join(__dirname, "..", "grammars", "cpp-highlights.scm");

describe("WASM Tree-sitter C grammar", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-c");
  });

  it("passes grammar tests", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "sample.c"), /\/\//);
    await runGrammarTests(path.join(__dirname, "fixtures", "sample.cpp"), /\/\//);
  });

  it("keeps shared C and C++ parameter scopes with leaf-rooted queries", async () => {
    const querySource = fs.readFileSync(sharedHighlightsPath, "utf8");
    expect(querySource).toContain('(#is? test.typeAt "parent parameter_list")');
    expect(querySource).not.toMatch(/\(parameter_list\s+["(]/);
    expect(querySource).not.toMatch(/\((?:string_literal|char_literal)\s+\(escape_sequence\)/);
    expect(querySource).not.toMatch(/\(preproc_params\s+(?:\(identifier\)|"\.\.\.")/);
    expect(querySource).toContain('(#is? test.childOfType "string_literal char_literal")');
    expect(querySource).toContain("(#is? test.childOfType preproc_params)");
    expect(fs.readFileSync(cppHighlightsPath, "utf8")).not.toContain("(escape_sequence)");

    for (const [scopeName, segment] of [
      ["source.c", "c"],
      ["source.cpp", "cpp"],
    ]) {
      const editor = await lumine.workspace.open();
      const text = 'const char *empty = "";\nint f(int first, int second) { return first; }';
      editor.setGrammar(lumine.grammars.grammarForScopeName(scopeName));
      editor.setText(text);
      await editor.languageMode.ready;

      const scopesAt = (index) =>
        editor
          .scopeDescriptorForBufferPosition(editor.getBuffer().positionForCharacterIndex(index))
          .getScopesArray();

      expect(scopesAt(text.indexOf("f(") + 1)).toContain(
        `punctuation.definition.parameters.begin.bracket.round.${segment}`,
      );
      expect(scopesAt(text.indexOf(") {"))).toContain(
        `punctuation.definition.parameters.end.bracket.round.${segment}`,
      );
      const emptyString = text.indexOf('""');
      expect(scopesAt(emptyString)).toContain(`punctuation.definition.string.begin.${segment}`);
      expect(scopesAt(emptyString)).not.toContain(`punctuation.definition.string.end.${segment}`);
      expect(scopesAt(emptyString + 1)).toContain(`punctuation.definition.string.end.${segment}`);
      expect(scopesAt(emptyString + 1)).not.toContain(
        `punctuation.definition.string.begin.${segment}`,
      );

      editor.setText(
        ["int many(", ...Array(6000).fill("int value,"), "int last", ") { return last; }"].join(
          "\r\n",
        ),
      );
      await editor.languageMode.atTransactionEnd();
      const closingRow = editor.getLastBufferRow();
      const layer = editor.languageMode.rootLanguageLayer;
      const captures = layer.queries.highlightsQuery.captures(layer.tree.rootNode, {
        startPosition: new Point(closingRow, 0),
        endPosition: new Point(closingRow, 1),
      });
      expect(
        captures.some(
          ({ name, node }) =>
            name === `punctuation.definition.parameters.end.bracket.round.${segment}` &&
            node.startPosition.row === closingRow,
        ),
      ).toBe(true);

      const middleCaptures = layer.queries.highlightsQuery.captures(layer.tree.rootNode, {
        startPosition: new Point(3000, 0),
        endPosition: new Point(3006, 0),
      });
      expect(middleCaptures.length).toBeLessThanOrEqual(150);
    }
  });

  it("keeps shared C and C++ raw captures bounded", async () => {
    for (const scopeName of ["source.c", "source.cpp"]) {
      const editor = await lumine.workspace.open();
      editor.setGrammar(lumine.grammars.grammarForScopeName(scopeName));
      editor.setText(
        Array.from(
          { length: 1000 },
          (_, index) => `int f${index}(int a, int b) { return call("x", a); } // generated`,
        ).join("\r\n"),
      );
      await editor.languageMode.ready;
      const layer = editor.languageMode.rootLanguageLayer;

      expect(
        layer.queries.highlightsQuery.captures(layer.tree.rootNode).length,
      ).toBeLessThanOrEqual(40000);
      expect(
        layer.queries.highlightsQuery.captures(layer.tree.rootNode, {
          startPosition: new Point(400, 0),
          endPosition: new Point(406, 0),
        }).length,
      ).toBeLessThanOrEqual(240);
    }
  });

  it("keeps large C++ template lists leaf-rooted with local tile captures", async () => {
    const editor = await lumine.workspace.open("templates.cpp");
    const lines = ["using Value = Template<"];
    for (let index = 0; index < 6000; index++) {
      lines.push(`  Type${index}${index < 5999 ? "," : ""}`);
    }
    lines.push(">;");
    editor.setText(lines.join("\r\n"));
    await editor.languageMode.ready;

    expect(
      editor.scopeDescriptorForBufferPosition([0, lines[0].indexOf("<")]).getScopesArray(),
    ).toContain("punctuation.definition.parameters.begin.bracket.angle.cpp");
    expect(editor.scopeDescriptorForBufferPosition([6001, 0]).getScopesArray()).toContain(
      "punctuation.definition.parameters.end.bracket.angle.cpp",
    );

    const layer = editor.languageMode.rootLanguageLayer;
    const captures = layer.queries.highlightsQuery.captures(layer.tree.rootNode, {
      startPosition: new Point(3000, 0),
      endPosition: new Point(3006, 0),
    });
    expect(captures.length).toBeLessThanOrEqual(36);
    expect(
      captures.every(
        (capture) =>
          capture.node.startPosition.row >= 3000 && capture.node.startPosition.row < 3006,
      ),
    ).toBe(true);

    const query = fs.readFileSync(cppHighlightsPath, "utf8");
    expect(query).toContain("(#is? test.childOfType template_argument_list)");
    expect(query).toContain("(#is? test.childOfType template_parameter_list)");
    expect(query).not.toMatch(/\(template_(?:argument|parameter)_list\s+"<"/);
  });

  it("keeps macro parameters and multiline string escapes tile-local", async () => {
    for (const [scopeName, segment] of [
      ["source.c", "c"],
      ["source.cpp", "cpp"],
    ]) {
      const editor = await lumine.workspace.open();
      editor.setGrammar(lumine.grammars.grammarForScopeName(scopeName));
      const macroLines = ["#define MANY("];
      for (let index = 0; index < 6000; index++) macroLines.push(`  value_${index},`);
      macroLines.push("  ...) value_0", "");
      editor.setText(macroLines.join("\r\n"));
      await editor.languageMode.ready;

      const layer = editor.languageMode.rootLanguageLayer;
      expect(layer.tree.rootNode.hasError).toBe(false);
      const parameterCaptures = layer.queries.highlightsQuery
        .captures(layer.tree.rootNode, {
          startPosition: new Point(3000, 0),
          endPosition: new Point(3006, 0),
        })
        .filter(({ name }) => name === `variable.parameter.preprocessor.${segment}`);
      expect(parameterCaptures.length).toBe(6);
      expect(
        parameterCaptures.every(
          ({ node }) => node.startPosition.row >= 3000 && node.startPosition.row < 3006,
        ),
      ).toBe(true);
      expect(editor.scopeDescriptorForBufferPosition([3000, 2]).getScopesArray()).toContain(
        `variable.parameter.preprocessor.${segment}`,
      );
      expect(editor.scopeDescriptorForBufferPosition([6001, 2]).getScopesArray()).toContain(
        `keyword.operator.ellipsis.${segment}`,
      );

      const stringLines = ['const char *value = "\\'];
      for (let index = 1; index < 6000; index++) stringLines.push("\\");
      stringLines.push('";');
      editor.setText(stringLines.join("\r\n"));
      await editor.languageMode.atTransactionEnd();
      expect(layer.tree.rootNode.hasError).toBe(false);
      expect(editor.scopeDescriptorForBufferPosition([3000, 0]).getScopesArray()).toContain(
        `constant.character.escape.${segment}`,
      );
      const escapeCaptures = layer.queries.highlightsQuery
        .captures(layer.tree.rootNode, {
          startPosition: new Point(3000, 0),
          endPosition: new Point(3006, 0),
        })
        .filter(({ name }) => name === `constant.character.escape.${segment}`);
      expect(escapeCaptures.length).toBe(6);
      expect(
        escapeCaptures.every(
          ({ node }) => node.startPosition.row >= 3000 && node.startPosition.row < 3006,
        ),
      ).toBe(true);
    }
  });

  it("does not treat a macro body's root identifier as a type", async () => {
    const editor = await lumine.workspace.open();
    const text = "#define FOO BAR";
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.c"));
    editor.setText(text);
    await editor.languageMode.ready;

    const point = editor.getBuffer().positionForCharacterIndex(text.indexOf("BAR"));
    const scopes = editor.scopeDescriptorForBufferPosition(point).getScopesArray();
    expect(scopes).not.toContain("storage.type.c");
  });
});
