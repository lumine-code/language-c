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
