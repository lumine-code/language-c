describe("c conservative indentation", () => {
  let editor;
  beforeEach(async () => {
    editor = null;
    jasmine.useRealClock();
    await lumine.packages.activatePackage("language-c");
  });
  afterEach(() => editor?.destroy());
  async function start(file, text) {
    if (!editor || !editor.getPath()?.endsWith(file)) {
      editor?.destroy();
      editor = await lumine.workspace.open(file);
    }
    editor.update({ autoIndent: true, tabLength: 2, softTabs: true });
    editor.setText(text);
    expect(await editor.whenGrammarSettled()).toBe(true);
  }
  describe("c", () => {
    it("indents Enter inside a block", async () => {
      await start("indentation.c", "void main() {\n}");
      editor.setCursorBufferPosition([0, Infinity]);
      await editor.insertNewline();
      expect(editor.lineTextForBufferRow(1)).toBe("  ");
    });
    it("dedents a typed closing brace", async () => {
      await start("indentation.c", "void main() {\n  run();\n  ");
      editor.setCursorBufferPosition([2, Infinity]);
      await editor.insertText("}", { autoIndent: true, autoDecreaseIndent: true });
      await editor.whenGrammarSettled();
      expect(editor.lineTextForBufferRow(2)).toBe("}");
    });
    it("reindents a body and its closing delimiter once", async () => {
      await start("indentation.c", "void main() {\nrun();\n}");
      await editor.autoIndentBufferRows(0, 2);
      expect(editor.getText()).toBe("void main() {\n  run();\n}");
    });
    it("does not add indent after a complete one-line block or delimiters in a comment", async () => {
      for (const text of ["void main() { run(); }", "// { [ ("]) {
        await start("indentation.c", text);
        editor.moveToEndOfLine();
        await editor.insertNewline();
        expect(editor.lineTextForBufferRow(1)).toBe("");
      }
    });
    it("preserves multiline literal whitespace during reindent", async () => {
      const source = 'const char *value = "first\\\n      { [ (\\\n  last";';
      await start("indentation.c", source);
      await editor.autoIndentBufferRows(0, editor.getLastBufferRow());
      expect(editor.getText()).toBe(source);
    });
    it("preserves multiline comment interiors during reindent", async () => {
      const source = "/* first\n      { [ (\n  last */";
      await start("indentation.c", source);
      await editor.autoIndentBufferRows(0, editor.getLastBufferRow());
      expect(editor.getText()).toBe(source);
    });
  });
  describe("cpp", () => {
    it("indents Enter inside a block", async () => {
      await start("indentation.cpp", "void main() {\n}");
      editor.setCursorBufferPosition([0, Infinity]);
      await editor.insertNewline();
      expect(editor.lineTextForBufferRow(1)).toBe("  ");
    });
    it("dedents a typed closing brace", async () => {
      await start("indentation.cpp", "void main() {\n  run();\n  ");
      editor.setCursorBufferPosition([2, Infinity]);
      await editor.insertText("}", { autoIndent: true, autoDecreaseIndent: true });
      await editor.whenGrammarSettled();
      expect(editor.lineTextForBufferRow(2)).toBe("}");
    });
    it("reindents a body and its closing delimiter once", async () => {
      await start("indentation.cpp", "void main() {\nrun();\n}");
      await editor.autoIndentBufferRows(0, 2);
      expect(editor.getText()).toBe("void main() {\n  run();\n}");
    });
    it("does not add indent after a complete one-line block or delimiters in a comment", async () => {
      for (const text of ["void main() { run(); }", "// { [ ("]) {
        await start("indentation.cpp", text);
        editor.moveToEndOfLine();
        await editor.insertNewline();
        expect(editor.lineTextForBufferRow(1)).toBe("");
      }
    });
    it("preserves multiline literal whitespace during reindent", async () => {
      const source = 'const char *value = R"(first\n      { [ (\n  last)";';
      await start("indentation.cpp", source);
      await editor.autoIndentBufferRows(0, editor.getLastBufferRow());
      expect(editor.getText()).toBe(source);
    });
    it("preserves multiline comment interiors during reindent", async () => {
      const source = "/* first\n      { [ (\n  last */";
      await start("indentation.cpp", source);
      await editor.autoIndentBufferRows(0, editor.getLastBufferRow());
      expect(editor.getText()).toBe(source);
    });
  });
  it("keeps one-line switch and access declarations from indenting their following row", async () => {
    for (const [file, text] of [
      ["test.c", "void run() { switch (value) { case 1: work(); } }"],
      ["test.cpp", "class Test { public: void run() {} };"],
    ]) {
      await start(file, text + "\n");
      expect(await editor.suggestedIndentForBufferRow(1)).toBe(0);
    }
  });
  it("retains the case label level after an inline body", async () => {
    for (const file of ["inline.c", "inline.cpp"]) {
      await start(file, "void main() {\n  switch (value) {\n    case 1: run();\n  }\n}");
      editor.setCursorBufferPosition([2, Infinity]);
      await editor.insertNewline();
      expect(editor.lineTextForBufferRow(3)).toBe("    ");
    }
  });
  it("indents after a colon-only case header", async () => {
    await start("header.c", "void main() {\n  switch (value) {\n    case 1:\n  }\n}");
    editor.setCursorBufferPosition([2, Infinity]);
    await editor.insertNewline();
    expect(editor.lineTextForBufferRow(3)).toBe("      ");
  });
});
