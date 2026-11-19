import type { DsaProblem } from "@debugLabs/shared";

export const VALID_ANAGRAM_PROBLEM: DsaProblem = {
  id: "valid-anagram",
  title: "Valid Anagram",
  difficulty: "Easy",
  category: "Strings & Hashing",
  tags: ["String", "Hash Table", "Debugging"],
  description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
  bugDescription:
    "The solution fails to verify that the string lengths are equal before counting frequencies, causing prefix and subset strings of different lengths to be mistakenly treated as valid anagrams.",
  hints: [
    "An anagram must use all original letters exactly once; therefore, `s.length` must strictly equal `t.length`.",
    "Verify string lengths at the very start of the function.",
  ],
  examples: [
    {
      id: 1,
      input: 's = "anagram", t = "nagaram"',
      output: "true",
      explanation: "Both strings have the same characters with identical frequencies.",
    },
    {
      id: 2,
      input: 's = "rat", t = "car"',
      output: "false",
      explanation: '"c" is present in t but not in s.',
    },
  ],
  constraints: [
    "1 <= s.length, t.length <= 5 * 10^4",
    "s and t consist of lowercase English letters.",
  ],
  starterCode: {
    javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isAnagram(s, t) {
  // BUG: Forgot to check if s.length !== t.length!
  // Causes strings of unequal lengths to pass if t is a subset of s!
  const count = {};
  for (const c of s) count[c] = (count[c] || 0) + 1;
  for (const c of t) {
    if (!count[c]) return false;
    count[c]--;
  }

  return true;
}
`,
    python: `class Solution:
    def isAnagram(self, s: str, t: str) -> bool:
        # BUG: Forgot to check if len(s) != len(t)!
        count = {}
        for c in s:
            count[c] = count.get(c, 0) + 1
        for c in t:
            if c not in count or count[c] == 0:
                return False
            count[c] -= 1

        return True
`,
    cpp: `#include <string>
#include <vector>
using namespace std;

class Solution {
public:
    bool isAnagram(string s, string t) {
        // BUG: Forgot length equality check!
        vector<int> counts(26, 0);
        for (char c : s) counts[c - 'a']++;
        for (char c : t) {
            if (--counts[c - 'a'] < 0) return false;
        }
        return true;
    }
};
`,
    java: `class Solution {
    public boolean isAnagram(String s, String t) {
        // BUG: Forgot length equality check!
        int[] counts = new int[26];
        for (char c : s.toCharArray()) counts[c - 'a']++;
        for (char c : t.toCharArray()) {
            if (--counts[c - 'a'] < 0) return false;
        }
        return true;
    }
}
`,
  },
  testCases: [
    {
      id: "tc-1",
      name: "Case 1",
      input: 's = "anagram", t = "nagaram"',
      expectedOutput: "true",
    },
    {
      id: "tc-2",
      name: "Case 2",
      input: 's = "rat", t = "car"',
      expectedOutput: "false",
    },
    {
      id: "tc-3",
      name: "Case 3",
      input: 's = "ab", t = "a"',
      expectedOutput: "false",
    },
  ],
  hiddenTestCases: [
    {
      id: "htc-1",
      name: "Hidden Case 1",
      input: 's = "a", t = "a"',
      expectedOutput: "true",
      hidden: true,
    },
    {
      id: "htc-2",
      name: "Hidden Case 2",
      input: 's = "a", t = "b"',
      expectedOutput: "false",
      hidden: true,
    },
    {
      id: "htc-3",
      name: "Hidden Case 3",
      input: 's = "aa", t = "a"',
      expectedOutput: "false",
      hidden: true,
    },
  ],
};
