import type { DsaProblem } from "@debugLabs/shared";
import { loadProblemTestCases } from "../testcases/loader.js";

const { testCases, hiddenTestCases } = loadProblemTestCases("two-sum");

export const TWO_SUM_PROBLEM: DsaProblem = {
  id: "two-sum",
  title: "Two Sum",
  difficulty: "Easy",
  category: "Arrays & Hashing",
  tags: ["Array", "Hash Table", "Debugging"],
  entrypointMethod: "twoSum",
  description: `Given an array of integers \`nums\` and an integer \`target\`, find the 0-based indices of the two numbers such that they add up to \`target\`.

**Input Format:**
- Line 1: \`n target\`
- Line 2: \`n\` integers separated by spaces

**Output Format:**
- Print the two 0-based indices separated by a space.`,
  bugDescription:
    "The author used 1-based indexing instead of 0-based indexing by adding +1 to indices.",
  hints: [
    "Array indices in modern programming languages are 0-based.",
    "Notice the + 1 added when returning or printing the indices.",
  ],
  examples: [
    {
      id: 1,
      input: "4 9\n2 7 11 15",
      output: "0 1",
      explanation: "nums[0] + nums[1] = 2 + 7 = 9",
    },
    {
      id: 2,
      input: "3 6\n3 2 4",
      output: "1 2",
    },
  ],
  constraints: [
    "2 <= n <= 10^4",
    "-10^9 <= nums[i] <= 10^9",
    "-10^9 <= target <= 10^9",
    "Exactly one valid solution exists.",
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
    const seen = new Map();
    for (let i = 0; i < nums.length; i++) {
      const complement = target - nums[i];
      if (seen.has(complement)) {
        return [seen.get(complement) + 1, i + 1];
      }
      seen.set(nums[i], i);
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
    python: `# User function Template for python3

class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, num in enumerate(nums):
            complement = target - num
            if complement in seen:
                return [seen[complement] + 1, i + 1]
            seen[num] = i
        return []

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
    res = solution.twoSum(nums, target)
    if res and len(res) == 2:
        print(f"{res[0]} {res[1]}")

if __name__ == "__main__":
    main()
# } Driver Code Ends
`,
    cpp: `// User function Template for C++

#include <vector>
#include <unordered_map>
using namespace std;

class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int complement = target - nums[i];
            if (seen.count(complement)) {
                return {seen[complement] + 1, i + 1};
            }
            seen[nums[i]] = i;
        }
        return {};
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
    vector<int> res = solution.twoSum(nums, target);
    if (res.size() == 2) {
        cout << res[0] << " " << res[1] << "\\n";
    }
    return 0;
}
//} Driver Code Ends
`,
    java: `// User function Template for Java

import java.util.*;

class Solution {
    public int[] twoSum(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement) + 1, i + 1 };
            }
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}

//{ Driver Code Starts
// Initial Template for Java
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
        int[] res = solution.twoSum(nums, target);
        if (res != null && res.length == 2) {
            System.out.println(res[0] + " " + res[1]);
        }
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
