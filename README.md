# language-c

C and C++ language support.

## Features

- **Grammars**: provides Tree-sitter grammars built from [tree-sitter-c](https://github.com/tree-sitter/tree-sitter-c) and [tree-sitter-cpp](https://github.com/tree-sitter/tree-sitter-cpp) and TextMate grammars derived from [atom/language-c](https://github.com/atom/language-c).
- **Syntax highlighting**: full grammar coverage for C and C++ files.
- **Snippets**: shortcuts for common declarations, control structures, and preprocessor directives.
- **Code folding**: collapse blocks, functions, and comments.
- **Comment toggling**: line and block comment support.

## Installation

To install `language-c` search for it in the Install pane of the Lumine settings, or run the command `lumine --install lumine-code/language-c`.

## Services

- `hyperlink.injection`: consumed to highlight URLs inside code and comments as clickable links.
- `todo.injection`: consumed to highlight `TODO`-style markers inside comments.

## Contributing

Got ideas to make this package better, found a bug, or want to help add new features? Just drop your thoughts on GitHub. Any feedback is welcome!
