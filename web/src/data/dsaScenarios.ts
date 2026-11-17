import type { DsaProblem, LanguageOption } from '../types/dsa';

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    id: 'javascript',
    name: 'JavaScript',
    extension: 'js',
    version: 'Node.js 24',
    monacoLanguage: 'javascript',
  },
  {
    id: 'python',
    name: 'Python',
    extension: 'py',
    version: 'Python 3.12',
    monacoLanguage: 'python',
  },
  {
    id: 'cpp',
    name: 'C++',
    extension: 'cpp',
    version: 'GCC 14 (C++20)',
    monacoLanguage: 'cpp',
  },
  {
    id: 'java',
    name: 'Java',
    extension: 'java',
    version: 'OpenJDK 21',
    monacoLanguage: 'java',
  },
];

export const DEFAULT_DSA_PROBLEMS: DsaProblem[] = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    tags: ['Array', 'Hash Table'],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        id: 1,
        input: 'nums = [2, 7, 11, 15], target = 9',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
      },
      {
        id: 2,
        input: 'nums = [3, 2, 4], target = 6',
        output: '[1, 2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].',
      },
      {
        id: 3,
        input: 'nums = [3, 3], target = 6',
        output: '[0, 1]',
        explanation: 'Because nums[0] + nums[1] == 6, we return [0, 1].',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}
`,
      python: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            diff = target - num
            if diff in seen:
                return [seen[diff], i]
            seen[num] = i
        return []
`,
      cpp: `#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            int diff = target - nums[i];
            if (seen.find(diff) != seen.end()) {
                return {seen[diff], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};
`,
      java: `import java.util.HashMap;
import java.util.Map;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int diff = target - nums[i];
            if (seen.containsKey(diff)) {
                return new int[] { seen.get(diff), i };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}
`,
    },
    testCases: [
      {
        id: 'tc-1',
        name: 'Case 1',
        input: 'nums = [2, 7, 11, 15], target = 9',
        expectedOutput: '[0, 1]',
      },
      {
        id: 'tc-2',
        name: 'Case 2',
        input: 'nums = [3, 2, 4], target = 6',
        expectedOutput: '[1, 2]',
      },
      {
        id: 'tc-3',
        name: 'Case 3',
        input: 'nums = [3, 3], target = 6',
        expectedOutput: '[0, 1]',
      },
    ],
  },
  {
    id: 'valid-anagram',
    title: 'Valid Anagram',
    difficulty: 'Easy',
    category: 'Strings & Hashing',
    tags: ['String', 'Hash Table', 'Sorting'],
    description: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.`,
    examples: [
      {
        id: 1,
        input: 's = "anagram", t = "nagaram"',
        output: 'true',
        explanation: 'Both strings have the same characters with identical frequencies.',
      },
      {
        id: 2,
        input: 's = "rat", t = "car"',
        output: 'false',
        explanation: '"c" is present in t but not in s.',
      },
    ],
    constraints: [
      '1 <= s.length, t.length <= 5 * 10^4',
      's and t consist of lowercase English letters.',
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @param {string} t
 * @return {boolean}
 */
function isAnagram(s, t) {
  if (s.length !== t.length) return false;
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
        if len(s) != len(t):
            return False
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
        if (s.length() != t.length()) return false;
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
        if (s.length() != t.length()) return false;
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
        id: 'tc-1',
        name: 'Case 1',
        input: 's = "anagram", t = "nagaram"',
        expectedOutput: 'true',
      },
      {
        id: 'tc-2',
        name: 'Case 2',
        input: 's = "rat", t = "car"',
        expectedOutput: 'false',
      },
    ],
  },
];
