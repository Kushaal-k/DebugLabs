import type { DsaProblem } from "@debugLabs/shared";

export const TWO_SUM_PROBLEM: DsaProblem = {
  id: "two-sum",
  title: "Two Sum",
  difficulty: "Easy",
  category: "Arrays & Hashing",
  tags: ["Array", "Hash Table", "Debugging"],
  description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

Return the answer in standard 0-based indices in any order.`,
  bugDescription:
    "The author attempted to convert from legacy 1-based indexing notation by adding `+ 1` to indices before returning, returning 1-based indices instead of standard 0-based indices.",
  hints: [
    "Array indices in modern programming languages are 0-based.",
    "Notice the `+ 1` added to the returned indices.",
    "Return the indices directly without the offset.",
  ],
  examples: [
    {
      id: 1,
      input: "nums = [2, 7, 11, 15], target = 9",
      output: "[0, 1]",
      explanation: "Because nums[0] + nums[1] == 9, we return [0, 1].",
    },
    {
      id: 2,
      input: "nums = [3, 2, 4], target = 6",
      output: "[1, 2]",
      explanation: "Because nums[1] + nums[2] == 6, we return [1, 2].",
    },
    {
      id: 3,
      input: "nums = [3, 3], target = 6",
      output: "[0, 1]",
      explanation: "Because nums[0] + nums[1] == 6, we return [0, 1].",
    },
  ],
  constraints: [
    "2 <= nums.length <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Only one valid answer exists.",
  ],
  starterCode: {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      // BUG: Returns 1-based indices instead of standard 0-based!
      return [seen.get(complement) + 1, i + 1];
    }
    seen.set(nums[i], i);
  }
  return [];
}
`,
    python: `from typing import List

class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                # BUG: Returns 1-based indices instead of 0-based!
                return [seen[complement] + 1, i + 1]
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
            int complement = target - nums[i];
            if (seen.find(complement) != seen.end()) {
                // BUG: Returns 1-based indices instead of 0-based!
                return {seen[complement] + 1, i + 1};
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
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                // BUG: Returns 1-based indices instead of 0-based!
                return new int[] { seen.get(complement) + 1, i + 1 };
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
      id: "tc-1",
      name: "Case 1",
      input: "nums = [2, 7, 11, 15], target = 9",
      expectedOutput: "[0, 1]",
    },
    {
      id: "tc-2",
      name: "Case 2",
      input: "nums = [3, 2, 4], target = 6",
      expectedOutput: "[1, 2]",
    },
    {
      id: "tc-3",
      name: "Case 3",
      input: "nums = [3, 3], target = 6",
      expectedOutput: "[0, 1]",
    },
  ],
  hiddenTestCases: [
    {
      id: "htc-1",
      name: "Hidden Case 1",
      input: "nums = [1, 2, 3, 9], target = 10",
      expectedOutput: "[0, 3]",
      hidden: true,
    },
    {
      id: "htc-2",
      name: "Hidden Case 2",
      input: "nums = [0, 4, 3, 0], target = 0",
      expectedOutput: "[0, 3]",
      hidden: true,
    },
    {
      id: "htc-3",
      name: "Hidden Case 3",
      input: "nums = [-3, 4, 3, 90], target = 0",
      expectedOutput: "[0, 2]",
      hidden: true,
    },
  ],
};
