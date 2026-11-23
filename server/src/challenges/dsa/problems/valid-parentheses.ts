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
    javascript: `// User function Template for javascript

class Solution {
  /**
   * @param {string} s
   * @return {boolean}
   */
  isValid(s) {
    if (!s) return true;

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

    return ok;
  }
}

//{ Driver Code Starts
// Initial Template for javascript
import fs from "node:fs";

function main() {
  const s = fs.readFileSync(0, "utf-8").trim();
  const solution = new Solution();
  console.log(solution.isValid(s) ? "true" : "false");
}

main();
//} Driver Code Ends
`,
    python: `# User function Template for python3

class Solution:
    def isValid(self, s: str) -> bool:
        if not s:
            return True

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

        return ok

# { Driver Code Starts
# Initial Template for python3
import sys

def main():
    s = sys.stdin.read().strip()
    solution = Solution()
    print("true" if solution.isValid(s) else "false")

if __name__ == "__main__":
    main()
# } Driver Code Ends
`,
    cpp: `// User function Template for C++

#include <string>
#include <stack>
using namespace std;

class Solution {
public:
    bool isValid(string s) {
        if (s.empty()) return true;

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

        return ok;
    }
};

//{ Driver Code Starts
// Initial Template for C++
#include <iostream>

int main() {
    string s;
    if (!(cin >> s)) {
        cout << "true\\n";
        return 0;
    }

    Solution solution;
    cout << (solution.isValid(s) ? "true" : "false") << "\\n";
    return 0;
}
//} Driver Code Ends
`,
    java: `// User function Template for Java

import java.util.*;

class Solution {
    public boolean isValid(String s) {
        if (s == null || s.isEmpty()) return true;

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

        return ok;
    }
}

//{ Driver Code Starts
// Initial Template for Java
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) {
            System.out.println("true");
            return;
        }
        String s = sc.next();

        Solution solution = new Solution();
        System.out.println(solution.isValid(s) ? "true" : "false");
    }
}
//} Driver Code Ends
`,
  },
  testCases,
  hiddenTestCases,
  timeLimitMs: 2000,
  memoryLimitMb: 256,
};
