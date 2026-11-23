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
      javascript: `// User function Template for javascript

class Solution {
  /**
   * @param {number[]} nums
   * @param {number} target
   * @return {number[]}
   */
  twoSum(nums, target) {
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
}

//{ Driver Code Starts
// Initial Template for javascript
import fs from "node:fs";

function main() {
  const input = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);
  if (!input[0]) return;
  const n = parseInt(input[0], 10);
  const target = parseInt(input[1], 10);
  const nums = input.slice(2, 2 + n).map(Number);

  const solution = new Solution();
  const res = solution.twoSum(nums, target);
  if (Array.isArray(res) && res.length === 2) {
    console.log(\`\${res[0]} \${res[1]}\`);
  }
}

main();
//} Driver Code Ends
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

# Example test run:
if __name__ == "__main__":
    sol = Solution()
    print("Output:", sol.twoSum([2, 7, 11, 15], 9))
`,
      cpp: `#include <vector>
#include <unordered_map>
#include <iostream>
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

// Example test run:
int main() {
    Solution sol;
    vector<int> nums = {2, 7, 11, 15};
    auto res = sol.twoSum(nums, 9);
    cout << "Output: [" << res[0] << ", " << res[1] << "]" << endl;
    return 0;
}
`,
      java: `import java.util.HashMap;
import java.util.Map;
import java.util.Arrays;

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

    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println("Output: " + Arrays.toString(sol.twoSum(new int[]{2, 7, 11, 15}, 9)));
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
      javascript: `// User function Template for javascript

class Solution {
  /**
   * @param {string} s
   * @param {string} t
   * @return {boolean}
   */
  isAnagram(s, t) {
    if (s.length !== t.length) return false;
    const count = {};
    for (const c of s) count[c] = (count[c] || 0) + 1;
    for (const c of t) {
      if (!count[c]) return false;
      count[c]--;
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

# Example test run:
if __name__ == "__main__":
    sol = Solution()
    print("Output:", str(sol.isAnagram("anagram", "nagaram")).lower())
`,
      cpp: `#include <string>
#include <vector>
#include <iostream>
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

// Example test run:
int main() {
    Solution sol;
    cout << "Output: " << (sol.isAnagram("anagram", "nagaram") ? "true" : "false") << endl;
    return 0;
}
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

    public static void main(String[] args) {
        Solution sol = new Solution();
        System.out.println("Output: " + sol.isAnagram("anagram", "nagaram"));
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
