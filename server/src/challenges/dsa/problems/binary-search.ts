import type { DsaProblem } from "@debugLabs/shared";

export const BINARY_SEARCH_PROBLEM: DsaProblem = {
  id: "binary-search",
  title: "Binary Search",
  difficulty: "Easy",
  category: "Binary Search",
  tags: ["Array", "Binary Search", "Debugging"],
  description: `Given an array of integers \`nums\` which is sorted in ascending order, and an integer \`target\`, write a function to search \`target\` in \`nums\`. If \`target\` exists, then return its index. Otherwise, return \`-1\`.

You must write an algorithm with \`O(log n)\` runtime complexity.`,
  bugDescription:
    "An off-by-one condition in the search loop misses target values located at the right boundary or in single-element arrays where `left == right`.",
  hints: [
    "When left == right, the interval still contains one uninspected candidate element.",
    "Change the loop condition to `left <= right` so that the boundary element is checked.",
  ],
  examples: [
    {
      id: 1,
      input: "nums = [-1, 0, 3, 5, 9, 12], target = 9",
      output: "4",
      explanation: "9 exists in nums and its index is 4",
    },
    {
      id: 2,
      input: "nums = [-1, 0, 3, 5, 9, 12], target = 2",
      output: "-1",
      explanation: "2 does not exist in nums so return -1",
    },
    {
      id: 3,
      input: "nums = [5], target = 5",
      output: "0",
      explanation: "Single-element array where target is at index 0.",
    },
  ],
  constraints: [
    "1 <= nums.length <= 10^4",
    "-10^4 < nums[i], target < 10^4",
    "All the integers in nums are unique.",
    "nums is sorted in ascending order.",
  ],
  starterCode: {
    javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number}
 */
function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  // BUG: 'left < right' terminates before inspecting the element when left == right!
  while (left < right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) {
      return mid;
    } else if (nums[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  return -1;
}
`,
    python: `from typing import List

class Solution:
    def search(self, nums: List[int], target: int) -> int:
        left, right = 0, len(nums) - 1

        # BUG: 'left < right' ignores candidate when left == right!
        while left < right:
            mid = (left + right) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1

        return -1
`,
    cpp: `#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0;
        int right = (int)nums.size() - 1;

        // BUG: 'left < right' terminates before checking left == right!
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return -1;
    }
};
`,
    java: `class Solution {
    public int search(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;

        // BUG: 'left < right' terminates before checking left == right!
        while (left < right) {
            int mid = left + (right - left) / 2;
            if (nums[mid] == target) {
                return mid;
            } else if (nums[mid] < target) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }

        return -1;
    }
}
`,
  },
  testCases: [
    {
      id: "tc-1",
      name: "Case 1",
      input: "nums = [-1, 0, 3, 5, 9, 12], target = 9",
      expectedOutput: "4",
    },
    {
      id: "tc-2",
      name: "Case 2",
      input: "nums = [-1, 0, 3, 5, 9, 12], target = 2",
      expectedOutput: "-1",
    },
    {
      id: "tc-3",
      name: "Case 3",
      input: "nums = [5], target = 5",
      expectedOutput: "0",
    },
  ],
  hiddenTestCases: [
    {
      id: "htc-1",
      name: "Hidden Case 1",
      input: "nums = [1, 2, 3, 4, 5], target = 5",
      expectedOutput: "4",
      hidden: true,
    },
    {
      id: "htc-2",
      name: "Hidden Case 2",
      input: "nums = [2, 5], target = 5",
      expectedOutput: "1",
      hidden: true,
    },
    {
      id: "htc-3",
      name: "Hidden Case 3",
      input: "nums = [1, 3, 5, 7], target = 0",
      expectedOutput: "-1",
      hidden: true,
    },
  ],
};
