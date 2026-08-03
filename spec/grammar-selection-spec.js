// A first-line match is worth 0.5 to a grammar's score, and preferring
// Tree-sitter is worth only 0.1. So whenever a TextMate grammar declares
// `firstLineMatch` and its Tree-sitter twin declares no `firstLineRegex`, every
// file whose first line matches quietly gets the TextMate grammar — here, the
// `-*- C++ -*-` modeline, which is the usual way an extensionless or `.h`
// header declares that it is C++ and not C.

describe("C++ grammar selection", () => {
  beforeEach(async () => {
    await atom.packages.activatePackage("language-c");
    atom.config.set("language.useTreeSitterParsers", true);
  });

  it("prefers the Tree-sitter grammar for a C++ modeline", () => {
    const grammar = atom.grammars.selectGrammar("shape.hh", "// -*- C++ -*-\nclass Shape {};\n");

    expect(grammar.scopeName).toBe("source.cpp");
    expect(grammar.constructor.name).toBe("TreeSitterGrammar");
  });

  it("prefers the Tree-sitter grammar for an ordinary C++ file", () => {
    const grammar = atom.grammars.selectGrammar("shape.cpp", "class Shape {};\n");

    expect(grammar.scopeName).toBe("source.cpp");
    expect(grammar.constructor.name).toBe("TreeSitterGrammar");
  });

  it("still honours the TextMate preference", () => {
    atom.config.set("language.useTreeSitterParsers", false);

    const grammar = atom.grammars.selectGrammar("shape.hh", "// -*- C++ -*-\nclass Shape {};\n");

    expect(grammar.scopeName).toBe("source.cpp");
    expect(grammar.constructor.name).toBe("Grammar");
  });
});
