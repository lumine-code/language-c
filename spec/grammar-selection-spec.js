// The modeline is the usual way an extensionless or `.h` header declares that
// it is C++ and not C.

describe("C++ grammar selection", () => {
  beforeEach(async () => {
    await lumine.packages.activatePackage("language-c");
  });

  it("prefers the Tree-sitter grammar for a C++ modeline", () => {
    const grammar = lumine.grammars.selectGrammar("shape.hh", "// -*- C++ -*-\nclass Shape {};\n");

    expect(grammar.scopeName).toBe("source.cpp");
    expect(grammar.constructor.name).toBe("TreeSitterGrammar");
  });

  it("prefers the Tree-sitter grammar for an ordinary C++ file", () => {
    const grammar = lumine.grammars.selectGrammar("shape.cpp", "class Shape {};\n");

    expect(grammar.scopeName).toBe("source.cpp");
    expect(grammar.constructor.name).toBe("TreeSitterGrammar");
  });
});
