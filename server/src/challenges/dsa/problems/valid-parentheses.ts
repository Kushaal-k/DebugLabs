import type { DsaProblem } from "@debugLabs/shared";

export const VALID_PARENTHESES_PROBLEM: DsaProblem = {
  id: "valid-parentheses",
  title: "Valid Parentheses",
  difficulty: "Easy",
  category: "Stack",
  tags: ["String", "Stack", "Debugging"],
  description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
  bugDescription:
    "When a closing bracket arrives while the stack is empty, the logic attempts to pop without checking if the stack has elements, causing runtime crashes or returning incorrect boolean values.",
  hints: [
    "Always check whether the stack is non-empty before attempting to pop.",
    "At the end of string traversal, make sure the stack is completely empty (`stack.length === 0`).",
  ],
  examples: [
    {
      id: 1,
      input: 's = "()"',
      output: "true",
    },
    {
      id: 2,
      input: 's = "()[]{}"',
      output: "true",
    },
    {
      id: 3,
      input: 's = "(]"',
      output: "false",
    },
  ],
  constraints: [
    "1 <= s.length <= 10^4",
    "s consists of parentheses only '()[]{}'.",
  ],
  starterCode: {
    javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  const map = { ")": "(", "}": "{", "]": "[" };
  const stack = [];

  for (const char of s) {
    if (map[char]) {
      // BUG: Pops without checking if stack is empty, resulting in undefined comparison!
      const top = stack.pop();
      if (top !== map[char]) {
        return false;
      }
    } else {
      stack.push(char);
    }
  }

  // BUG: Forgot to check if unclosed open brackets remain in the stack!
  return true;
}
`,
    python: `class Solution:
    def isValid(self, s: str) -> bool:
        pairs = {")": "(", "}": "{", "]": "["}
        stack = []

        for char in s:
            if char in pairs:
                # BUG: Pops without checking if stack is empty! Raises IndexError on leading close bracket
                top = stack.pop()
                if top != pairs[char]:
                    return False
            else:
                stack.append(char)

        # BUG: Forgot to ensure all brackets were closed!
        return True
`,
    cpp: `#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        stack<char> st;

        for (char c : s) {
            if (c == ')' || c == '}' || c == ']') {
                // BUG: Calling top() or pop() on empty stack triggers undefined behavior / crash!
                char top = st.top();
                st.pop();
                if ((c == ')' && top != '(') ||
                    (c == '}' && top != '{') ||
                    (c == ']' && top != '[')) {
                    return false;
                }
            } else {
                st.push(c);
            }
        }

        // BUG: Misses checking if unclosed brackets remain!
        return true;
    }
};
`,
    java: `import java.util.Stack;

class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();

        for (char c : s.toCharArray()) {
            if (c == ')' || c == '}' || c == ']') {
                // BUG: Calling pop() on an empty stack throws EmptyStackException!
                char top = stack.pop();
                if ((c == ')' && top != '(') ||
                    (c == '}' && top != '{') ||
                    (c == ']' && top != '[')) {
                    return false;
                }
            } else {
                stack.push(c);
            }
        }

        // BUG: Forgot to check if stack is empty!
        return true;
    }
}
`,
  },
  testCases: [
    {
      id: "tc-1",
      name: "Case 1",
      input: 's = "()"',
      expectedOutput: "true",
    },
    {
      id: "tc-2",
      name: "Case 2",
      input: 's = "()[]{}"',
      expectedOutput: "true",
    },
    {
      id: "tc-3",
      name: "Case 3",
      input: 's = "(]"',
      expectedOutput: "false",
    },
  ],
  hiddenTestCases: [
    {
      id: "htc-1",
      name: "Hidden Case 1",
      input: 's = "]"',
      expectedOutput: "false",
      hidden: true,
    },
    {
      id: "htc-2",
      name: "Hidden Case 2",
      input: 's = "{[]}"',
      expectedOutput: "true",
      hidden: true,
    },
    {
      id: "htc-3",
      name: "Hidden Case 3",
      input: 's = "([)]"',
      expectedOutput: "false",
      hidden: true,
    },
  ],
};
