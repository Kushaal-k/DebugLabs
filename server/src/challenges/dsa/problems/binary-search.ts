import type { DsaProblem } from "@debugLabs/shared";
import { loadProblemTestCases } from "../testcases/loader.js";

const { testCases, hiddenTestCases } = loadProblemTestCases("binary-search");

export const BINARY_SEARCH_PROBLEM: DsaProblem = {
  id: "binary-search",
  title: "Binary Search",
  difficulty: "Easy",
  category: "Binary Search",
  tags: ["Array", "Binary Search", "Debugging"],
  entrypointMethod: "search",
  description: `Given a sorted array of integers \`nums\` and an integer \`target\`, search for \`target\` in \`nums\`. If it exists, return its 0-based index. Otherwise, return \`-1\`.

**Input Format:**
- Line 1: \`n target\`
- Line 2: \`n\` sorted integers separated by spaces

**Output Format:**
- Print the index of \`target\`, or \`-1\` if not found.`,
  bugDescription:
    "An off-by-one condition in the search loop (`while (left < right)`) terminates before checking when `left == right`.",
  hints: [
    "When left == right, the interval still contains one uninspected candidate element.",
    "Change the loop condition to `left <= right` so that the boundary element is checked.",
  ],
  examples: [
    {
      id: 1,
      input: "6 9\n-1 0 3 5 9 12",
      output: "4",
    },
    {
      id: 2,
      input: "6 2\n-1 0 3 5 9 12",
      output: "-1",
    },
  ],
  constraints: [
    "1 <= n <= 10^4",
    "-10^4 <= nums[i], target <= 10^4",
    "nums is sorted in ascending order.",
  ],
  starterCode: {
    javascript: `// User function Template for javascript

class Solution {
  /**
   * @param {number[]} nums
   * @param {number} target
   * @return {number}
   */
  search(nums, target) {
    let left = 0;
    let right = nums.length - 1;

    while (left < right) {
      const mid = Math.floor(left + (right - left) / 2);
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
  console.log(solution.search(nums, target));
}

main();
//} Driver Code Ends
`,
    python: `# User function Template for python3

class Solution:
    def search(self, nums: list[int], target: int) -> int:
        left, right = 0, len(nums) - 1
        ans = -1

        while left < right:
            mid = left + (right - left) // 2
            if nums[mid] == target:
                return mid
            elif nums[mid] < target:
                left = mid + 1
            else:
                right = mid - 1

        return ans

# { Driver Code Starts
# Initial Template for python3
import sys

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    target = int(input_data[1])
    nums = [int(x) for x in input_data[2:2 + n]]

    solution = Solution()
    print(solution.search(nums, target))

if __name__ == "__main__":
    main()
# } Driver Code Ends
`,
    cpp: `// User function Template for C++

#include <vector>
using namespace std;

class Solution {
public:
    int search(vector<int>& nums, int target) {
        int left = 0, right = (int)nums.size() - 1;

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

//{ Driver Code Starts
// Initial Template for C++
#include <iostream>

int main() {
    int n, target;
    if (!(cin >> n >> target)) return 0;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) cin >> nums[i];

    Solution solution;
    cout << solution.search(nums, target) << "\\n";
    return 0;
}
//} Driver Code Ends
`,
    java: `// User function Template for Java

class Solution {
    public int search(int[] nums, int target) {
        int left = 0, right = nums.length - 1;

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

//{ Driver Code Starts
// Initial Template for Java
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int target = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }

        Solution solution = new Solution();
        System.out.println(solution.search(nums, target));
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
