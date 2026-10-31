const fs = require("fs");
const path = require("path");

describe("C++ modeline selection", () => {
  let grammar;

  beforeEach(async () => {
    const pkg = await lumine.packages.activatePackage("language-c");
    expect(fs.realpathSync(pkg.path)).toBe(path.resolve(__dirname, ".."));
    grammar = lumine.grammars.grammarForScopeName("source.cpp");
  });

  it("selects extensionless files from Vim filetype, ft, and syntax modelines", () => {
    for (const key of ["filetype", "ft", "syntax"]) {
      const text = "// vim: set tabstop=4 set " + key + "=cpp:";
      expect(lumine.grammars.selectGrammar("modeline", text).scopeName).toBe("source.cpp");
    }
  });

  it("preserves token order and modelines on a later supplied prefix line", () => {
    expect(grammar.firstLineRegex.test("vim: ft=cpp")).toBe(false);
    expect(grammar.firstLineRegex.test("ft=cpp // vim: set tabstop=4")).toBe(false);
    expect(grammar.firstLineRegex.test("preceding line\n// vim: set ft=cpp:")).toBe(true);
  });

  it("requires complete C++ modeline aliases", () => {
    for (const key of ["filetype", "ft", "syntax"]) {
      for (const name of ["cpp", "c++"])
        expect(
          lumine.grammars.selectGrammar("modeline", "// vim: set " + key + "=" + name + ":")
            .scopeName,
        )
          .withContext(name)
          .toBe("source.cpp");
      for (const name of ["cppish", "cpp-extra", "c++ish"])
        expect(
          lumine.grammars.selectGrammar("modeline", "// vim: set " + key + "=" + name + ":")
            .scopeName,
        )
          .withContext(name)
          .not.toBe("source.cpp");
    }
  });

  it("accepts complete aliases followed by LF or CRLF without a colon", () => {
    for (const ending of ["\n", "\r\n"])
      for (const key of ["filetype", "ft", "syntax"])
        for (const name of ["cpp", "c++"]) {
          const prefix = "// vim: set " + key + "=";
          expect(
            lumine.grammars.selectGrammar(
              "modeline",
              prefix + name + ending + ending + "int value;",
            ).scopeName,
          )
            .withContext(name + JSON.stringify(ending))
            .toBe("source.cpp");
          expect(
            lumine.grammars.selectGrammar("modeline", prefix + name + "ish" + ending).scopeName,
          ).not.toBe("source.cpp");
        }
  });

  it("keeps failed modelines from revisiting Vim and set tokens", () => {
    expect(grammar.firstLineRegex.source).toContain("(?:(?!vim\\b).)*vim\\b");
    expect(grammar.firstLineRegex.source).toContain("(?:(?!\\bset\\b).)*\\bset\\b");
    for (const text of ["vim " + " set ".repeat(16000) + "x", "vim ".repeat(16000) + "x"]) {
      expect(grammar.firstLineRegex.test(text)).toBe(false);
      expect(lumine.grammars.selectGrammar("modeline", text).scopeName).not.toBe("source.cpp");
    }
  });
});
