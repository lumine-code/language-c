const path = require("path");

describe("WASM Tree-sitter C grammar", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-c");
  });

  it("passes grammar tests", async () => {
    await runGrammarTests(path.join(__dirname, "fixtures", "sample.c"), /\/\//);
    await runGrammarTests(path.join(__dirname, "fixtures", "sample.cpp"), /\/\//);
  });

  it("keeps shared C and C++ parameter scopes with leaf-rooted queries", async () => {
    for (const [scopeName, segment] of [
      ["source.c", "c"],
      ["source.cpp", "cpp"],
    ]) {
      const editor = await lumine.workspace.open();
      const text = "int f(int first, int second) { return first; }";
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
