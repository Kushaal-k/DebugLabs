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
    javascript: `import fs from "node:fs";

function main() {
  const words = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);
  if (words.length < 2) return;
  const [s, t] = words;

  // BUG: Missing length check! If s and t have different lengths, false positives occur
  // if (s.length !== t.length) { console.log("false"); return; }

  const counts = {};
  for (const c of s) counts[c] = (counts[c] || 0) + 1;
  for (const c of t) {
    if (!counts[c]) {
      console.log("false");
      return;
    }
    counts[c]--;
  }

  console.log("true");
}

main();
`,
    python: `import sys

def main():
    words = sys.stdin.read().split()
    if len(words) < 2:
        return
    s, t = words[0], words[1]

    # BUG: Missing length check! If s and t have different lengths, false positives occur
    # if len(s) != len(t):
    #     print("false")
    #     return

    counts = {}
    for c in s:
        counts[c] = counts.get(c, 0) + 1
    for c in t:
        if c not in counts or counts[c] == 0:
            print("false")
            return
        counts[c] -= 1

    print("true")

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <string>
#include <unordered_map>
using namespace std;

int main() {
    string s, t;
    if (!(cin >> s >> t)) return 0;

    // BUG: Missing length check! If s and t have different lengths, false positives occur
    // if (s.length() != t.length()) { cout << "false\\n"; return 0; }

    unordered_map<char, int> counts;
    for (char c : s) counts[c]++;
    for (char c : t) {
        if (!counts.count(c) || counts[c] == 0) {
            cout << "false\\n";
            return 0;
        }
        counts[c]--;
    }
    cout << "true\\n";
    return 0;
}
`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNext()) return;
        String s = sc.next();
        if (!sc.hasNext()) return;
        String t = sc.next();

        // BUG: Missing length check!
        // if (s.length() != t.length()) { System.out.println("false"); return; }

        Map<Character, Integer> counts = new HashMap<>();
        for (char c : s.toCharArray()) counts.put(c, counts.getOrDefault(c, 0) + 1);
        for (char c : t.toCharArray()) {
            if (!counts.containsKey(c) || counts.get(c) == 0) {
                System.out.println("false");
                return;
            }
            counts.put(c, counts.get(c) - 1);
        }

        System.out.println("true");
    }
}
`,
  },
  testCases,
  hiddenTestCases,
  timeLimitMs: 2000,
  memoryLimitMb: 256,
};
