; Raw-string parentheses quote data, including when recovery drops the literal
; wrapper. Its raw prefix identifies the opener without rejecting other errors.
(raw_string_literal ["(" ")"] @_IGNORE_ (#set! capture.final true))
(ERROR ["R\"" "LR\"" "uR\"" "UR\"" "u8R\""]
  . (raw_string_delimiter)? . "(" @_IGNORE_
  (#set! capture.final true))

["{" "(" "["] @indent

["}" ")" "]"] @dedent


; With access specifiers like…
;
; class Foo {
; public:
;   void bar() {}
; }
;
; …prevailing style is to dedent the specifier so it matches the indentation of
; the line above.
((access_specifier) @dedent @indent
  (#is-not? test.endsOnSameRowAs parent.endPosition))

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
([(string_literal) (raw_string_literal) (comment)] @preserve
  (#is? indent.reindent true)
  (#is-not? indent.matchesCurrentRow startPosition)
  (#set! indent.force true))
