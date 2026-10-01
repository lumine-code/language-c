([
  (preproc_def value: (preproc_arg) @injection.content)
  (preproc_function_def value: (preproc_arg) @injection.content)
] @injection.owner
  (#set! injection.language "cpp"))

((comment) @injection.owner @injection.content
  (#set! injection.language "hyperlink")
  (#set! injection.language-scope "none")
  (#set! injection.include-children))

((string_literal (string_content) @injection.owner @injection.content)
  (#set! injection.language "hyperlink")
  (#set! injection.language-scope "none"))
((comment) @injection.owner @injection.content
  (#set! injection.language "todo")
  (#set! injection.language-scope "none")
  (#set! injection.include-children))
