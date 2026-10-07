describe("C++ module declarations", () => {
  let editor;

  beforeEach(async () => {
    await lumine.packages.activatePackage("language-c");
    editor = await lumine.workspace.open();
    editor.setGrammar(lumine.grammars.grammarForScopeName("source.cpp"));
  });

  afterEach(() => editor?.destroy());

  it("parses and highlights module, import and export declarations", async () => {
    editor.setText("export module demo;\nimport std;\nexport int value() { return 1; }\n");
    await editor.languageMode.ready;
    const root = editor.languageMode.tree.rootNode;
    expect(root.hasError).toBe(false);
    expect(root.namedChildren.map((node) => node.type)).toEqual([
      "module_declaration",
      "import_declaration",
      "export_declaration",
    ]);
    for (const point of [
      [0, 0],
      [0, 7],
      [1, 0],
      [2, 0],
    ]) {
      expect(editor.scopeDescriptorForBufferPosition(point).getScopesArray()).toContain(
        "keyword.control.import.cpp",
      );
    }
    expect(editor.scopeDescriptorForBufferPosition([0, 14]).getScopesArray()).toContain(
      "entity.name.namespace.cpp",
    );
  });
});
