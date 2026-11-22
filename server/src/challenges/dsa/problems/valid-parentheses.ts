import type { DsaProblem } from "@debugLabs/shared";
import { loadProblemTestCases } from "../testcases/loader.js";

const { testCases, hiddenTestCases } = loadProblemTestCases("valid-parentheses");

export const VALID_PARENTHESES_PROBLEM: DsaProblem = {
  id: "valid-parentheses",
  title: "Valid Parentheses",
  difficulty: "Easy",
  category: "Stack",
  tags: ["String", "Stack", "Debugging"],
  entrypointMethod: "isValid",
  description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

**Input Format:**
- Line 1: string \`s\`

**Output Format:**
- Print \`true\` or \`false\`.`,
  bugDescription:
    "The code fails to verify that the stack is completely empty at the end, returning true even if unmatched opening brackets remain.",
  hints: [
    "Always check whether the stack is non-empty before attempting to pop.",
    "At the end of string traversal, make sure the stack is completely empty (`stack.length === 0`).",
  ],
  examples: [
    {
      id: 1,
      input: "()",
      output: "true",
    },
    {
      id: 2,
      input: "()[]{}",
      output: "true",
    },
    {
      id: 3,
      input: "(]",
      output: "false",
    },
  ],
  constraints: [
    "1 <= s.length <= 10^4",
    "s consists of parentheses only '()[]{}'.",
  ],
  starterCode: {
    javascript: `import fs from "node:fs";

function main() {
  const s = fs.readFileSync(0, "utf-8").trim();
  if (!s) {
    console.log("true");
    return;
  }

  const stack = [];
  const map = { ")": "(", "}": "{", "]": "[" };
  let ok = true;

  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (map[c]) {
      if (stack.length === 0) {
        ok = false;
        break;
      }
      const top = stack.pop();
      if (top !== map[c]) {
        ok = false;
        break;
      }
    } else {
      stack.push(c);
    }
  }

  // BUG: Forgot to check if stack is empty at the end!
  console.log(ok ? "true" : "false");
}

main();
`,
    python: `import sys

def main():
    s = sys.stdin.read().strip()
    if not s:
        print("true")
        return

    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    ok = True

    for c in s:
        if c in mapping:
            if not stack:
                ok = False
                break
            top = stack.pop()
            if top != mapping[c]:
                ok = False
                break
        else:
            stack.append(c)

    # BUG: Forgot to check if stack is empty at the end!
    print("true" if ok else "false")

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <string>
#include <stack>
using namespace std;

int main() {
    string s;
    if (!(cin >> s)) {
        cout << "true\\n";
        return 0;
    }

    stack<char> st;
    bool ok = true;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') {
            st.push(c);
        } else {
            if (st.empty()) {
                ok = false;
                break;
            }
            char top = st.top();
            st.pop();
            if ((c == ')' && top != '(') ||
                (c == '}' && top != '{') ||
                (c == ']' && top != '[')) {
                ok = false;
                break;
            }
        }
    }

    // BUG: Forgot to check if stack is empty at the end!
    cout << (ok ? "true" : "false") << "\\n";
    return 0;
}
`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) {
            System.out.println("true");
            return;
        }
        String s = sc.next();
        Deque<Character> stack = new ArrayDeque<>();
        boolean ok = true;

        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '(' || c == '{' || c == '[') {
                stack.push(c);
            } else {
                if (stack.isEmpty()) {
                    ok = false;
                    break;
                }
                char top = stack.pop();
                if ((c == ')' && top != '(') ||
                    (c == '}' && top != '{') ||
                    (c == ']' && top != '[')) {
                    ok = false;
                    break;
                }
            }
        }

        // BUG: Forgot to check if stack is empty at the end!
        System.out.println(ok ? "true" : "false");
    }
}
`,
  },
  testCases,
  hiddenTestCases,
  timeLimitMs: 2000,
  memoryLimitMb: 256,
};
