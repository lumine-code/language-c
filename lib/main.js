let injectionRegistrations = [];

exports.activate = function () {
  // Highlight macro bodies as C/C++
  for (const language of ["c", "cpp"]) {
    for (const nodeType of ["preproc_def", "preproc_function_def"]) {
      injectionRegistrations.push(
        lumine.grammars.addInjectionPoint(`source.${language}`, {
          type: nodeType,
          language() {
            return language;
          },
          content(node) {
            return node.descendantsOfType("preproc_arg");
          },
        }),
      );
    }
  }
};

exports.consumeHyperlinkInjection = (hyperlink) => {
  const registrations = [];
  for (const language of ["c", "cpp"]) {
    registrations.push(
      hyperlink.addInjectionPoint(`source.${language}`, {
        types: ["comment", "string_literal"],
      }),
    );
  }
  return {
    dispose() {
      for (const registration of registrations.splice(0)) registration.dispose();
    },
  };
};

exports.consumeTodoInjection = (todo) => {
  const registrations = [];
  for (const language of ["c", "cpp"]) {
    registrations.push(todo.addInjectionPoint(`source.${language}`, { types: ["comment"] }));
  }
  return {
    dispose() {
      for (const registration of registrations.splice(0)) registration.dispose();
    },
  };
};

exports.deactivate = function () {
  for (const registration of injectionRegistrations.splice(0)) registration.dispose();
};
