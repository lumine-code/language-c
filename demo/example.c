#include <stdio.h>

#define FOO true

int table[4];

// THIS IS A COMMENT

/* This is also a comment. */

int main() {
  printf("Hello,\" World!");

  int32_t foo;

  int valueA = 2;
  int valueB = 4;

  valueA++;

  int product = valueA * valueB;

  return 0;
}

int foo() {
  // something
  bool x = true;
  bool y = false;
  if (x && y) {
    // something
  }

  return rand();
}

const char get_char() {
  return 'x';
}

const char *get_string() {
  return "Hello, world!";
}

enum Color {
  red,
  green,
  blue
};
enum Color r = red;

struct MyStructure {
  int myNum;
  char myLetter;
};
