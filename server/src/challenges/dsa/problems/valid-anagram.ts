import type { DsaProblem } from "@debugLabs/shared";
import { loadProblemTestCases } from "../testcases/loader.js";

const { testCases, hiddenTestCases } = loadProblemTestCases("valid-anagram");

export const VALID_ANAGRAM_PROBLEM: DsaProblem = {
  id: "valid-anagram",
  title: "Valid Anagram",
  difficulty: "Easy",
  category: "Strings & Hashing",
  tags: ["String", "Hash Table", "Debugging"],
  entrypointMethod: "isAnagram",
  description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

**Input Format:**
- Line 1: string \`s\`
- Line 2: string \`t\`

**Output Format:**
- Print \`true\` or \`false\`.`,
  bugDescription:
    "The solution fails to verify that the string lengths are equal before counting frequencies, causing prefix strings to be mistakenly treated as valid anagrams.",
  hints: [
    "An anagram must use all original letters exactly once; therefore, `s.length` must strictly equal `t.length`.",
    "Verify string lengths at the very start.",
  ],
  examples: [
    {
      id: 1,
      input: "anagram\nnagaram",
      output: "true",
    },
    {
      id: 2,
      input: "rat\ncar",
      output: "false",
    },
  ],
  constraints: [
    "1 <= s.length, t.length <= 5 * 10^4",
    "s and t consist of lowercase English letters.",
  ],
  starterCode: {
    javascript: `class Solution {
  /**
   * @param {string} s
   * @param {string} t
   * @return {boolean}
   */
  isAnagram(s, t) {
    const counts = {};
    for (const c of s) counts[c] = (counts[c] || 0) + 1;
    for (const c of t) {
      if (!counts[c]) {
        return false;
      }
      counts[c]--;
    }
    return true;
  }
}

//{ Driver Code Starts
// Initial Template for javascript
import fs from "node:fs";

function main() {
  const words = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);
  if (words.length < 2) return;
  const [s, t] = words;

  const solution = new Solution();
  console.log(solution.isAnagram(s, t) ? "true" : "false");
}

main();
//} Driver Code Ends
`,
    python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        counts = {}
        for c in s:
            counts[c] = counts.get(c, 0) + 1
        for c in t:
            if c not in counts or counts[c] == 0:
                return False
            counts[c] -= 1
        return True

# { Driver Code Starts
# Initial Template for python3
import sys

def main():
    words = sys.stdin.read().split()
    if len(words) < 2:
        return
    s, t = words[0], words[1]

    solution = Solution()
    print("true" if solution.isAnagram(s, t) else "false")

if __name__ == "__main__":
    main()
# } Driver Code Ends
`,
    cpp: `#include <string>
#include <unordered_map>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        unordered_map<char, int> counts;
        for (char c : s) counts[c]++;
        for (char c : t) {
            if (!counts.count(c) || counts[c] == 0) {
                return false;
            }
            counts[c]--;
        }
        return true;
    }
};

//{ Driver Code Starts
// Initial Template for C++
#include <iostream>

int main() {
    string s, t;
    if (!(cin >> s >> t)) return 0;

    Solution solution;
    cout << (solution.isAnagram(s, t) ? "true" : "false") << "\\n";
    return 0;
}
//} Driver Code Ends
`,
    java: `import java.util.*;

class Solution {
    public boolean isAnagram(String s, String t) {
        Map<Character, Integer> counts = new HashMap<>();
        for (char c : s.toCharArray()) counts.put(c, counts.getOrDefault(c, 0) + 1);
        for (char c : t.toCharArray()) {
            if (!counts.containsKey(c) || counts.get(c) == 0) {
                return false;
            }
            counts.put(c, counts.get(c) - 1);
        }
        return true;
    }
}

//{ Driver Code Starts
// Initial Template for Java
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        if (!sc.hasNext()) return;
        String t = sc.next();

        Solution solution = new Solution();
        System.out.println(solution.isAnagram(s, t) ? "true" : "false");
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
