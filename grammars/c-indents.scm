["{" "(" "["] @indent

["}" ")" "]"] @dedent

; `switch` statements have a couple schools of thought, indentation-wise, and
; we might have to make this configurable somehow.
(switch_statement
  body: (compound_statement "}" @match
    (#is? test.last true))
  (#set! indent.matchIndentOf parent.startPosition))

; 'case' and 'default' need to be indented one level more than their containing
; `switch`.
(["case" "default"] @match
  (#set! indent.matchIndentOf parent.parent.startPosition)
  (#set! indent.offsetIndent 1))

(":" @indent
  (#is? test.childOfType case_statement)
  (#is? test.lastTextOnRow true))

; Reindent code without rewriting whitespace that belongs to multiline text.
([(string_literal) (comment)] @preserve
  (#is? indent.reindent true)
  (#is-not? indent.matchesCurrentRow startPosition)
  (#set! indent.force true))
