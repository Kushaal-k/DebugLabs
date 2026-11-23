import type { DsaProblem } from "@debugLabs/shared";
import { loadProblemTestCases } from "../testcases/loader.js";

const { testCases, hiddenTestCases } = loadProblemTestCases("merge-intervals");

export const MERGE_INTERVALS_PROBLEM: DsaProblem = {
  id: "merge-intervals",
  title: "Merge Intervals",
  difficulty: "Medium",
  category: "Intervals",
  tags: ["Array", "Sorting", "Debugging"],
  entrypointMethod: "merge",
  description: `Given an array of intervals where each interval has \`[start, end]\`, merge all overlapping intervals, and print each resulting non-overlapping interval.

**Input Format:**
- Line 1: \`n\`
- Next \`n\` lines: \`start end\`

**Output Format:**
- For each merged interval, print \`start end\` on its own line.`,
  bugDescription:
    "The code iterates through intervals assuming they are already sorted by start time. When unsorted inputs are given, intervals that should merge are wrongly appended as disjoint entries.",
  hints: [
    "Sort the intervals by their start time before merging.",
    "Compare each interval's start with the end of the last merged interval.",
  ],
  examples: [
    {
      id: 1,
      input: "4\n1 3\n2 6\n8 10\n15 18",
      output: "1 6\n8 10\n15 18",
    },
    {
      id: 2,
      input: "2\n1 4\n4 5",
      output: "1 5",
    },
  ],
  constraints: [
    "1 <= n <= 10^4",
    "0 <= start <= end <= 10^4",
  ],
  starterCode: {
    javascript: `// User function Template for javascript

class Solution {
  /**
   * @param {number[][]} intervals
   * @return {number[][]}
   */
  merge(intervals) {
    if (intervals.length <= 1) return intervals;

    const merged = [intervals[0]];
    for (let i = 1; i < intervals.length; i++) {
      const prev = merged[merged.length - 1];
      const curr = intervals[i];
      if (curr[0] <= prev[1]) {
        prev[1] = Math.max(prev[1], curr[1]);
      } else {
        merged.push(curr);
      }
    }
    return merged;
  }
}

//{ Driver Code Starts
// Initial Template for javascript
import fs from "node:fs";

function main() {
  const input = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);
  if (!input[0]) return;
  const n = parseInt(input[0], 10);
  const intervals = [];
  let idx = 1;
  for (let i = 0; i < n; i++) {
    intervals.push([parseInt(input[idx], 10), parseInt(input[idx + 1], 10)]);
    idx += 2;
  }

  const solution = new Solution();
  const merged = solution.merge(intervals);

  for (const [start, end] of merged) {
    console.log(\`\${start} \${end}\`);
  }
}

main();
//} Driver Code Ends
`,
    python: `# User function Template for python3

class Solution:
    def merge(self, intervals: list[list[int]]) -> list[list[int]]:
        if len(intervals) <= 1:
            return intervals

        merged = [intervals[0]]
        for curr in intervals[1:]:
            prev = merged[-1]
            if curr[0] <= prev[1]:
                prev[1] = max(prev[1], curr[1])
            else:
                merged.append(curr)

        return merged

# { Driver Code Starts
# Initial Template for python3
import sys

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    intervals = []
    idx = 1
    for _ in range(n):
        intervals.append([int(input_data[idx]), int(input_data[idx + 1])])
        idx += 2

    solution = Solution()
    merged = solution.merge(intervals)

    for start, end in merged:
        print(f"{start} {end}")

if __name__ == "__main__":
    main()
# } Driver Code Ends
`,
    cpp: `// User function Template for C++

#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<pair<int, int>> merge(vector<pair<int, int>>& intervals) {
        if (intervals.empty()) return {};

        vector<pair<int, int>> merged;
        merged.push_back(intervals[0]);
        for (size_t i = 1; i < intervals.size(); i++) {
            auto& prev = merged.back();
            auto curr = intervals[i];
            if (curr.first <= prev.second) {
                prev.second = max(prev.second, curr.second);
            } else {
                merged.push_back(curr);
            }
        }
        return merged;
    }
};

//{ Driver Code Starts
// Initial Template for C++
#include <iostream>

int main() {
    int n;
    if (!(cin >> n) || n <= 0) return 0;
    vector<pair<int, int>> intervals(n);
    for (int i = 0; i < n; i++) {
        cin >> intervals[i].first >> intervals[i].second;
    }

    Solution solution;
    vector<pair<int, int>> merged = solution.merge(intervals);

    for (const auto& p : merged) {
        cout << p.first << " " << p.second << "\\n";
    }
    return 0;
}
//} Driver Code Ends
`,
    java: `// User function Template for Java

import java.util.*;

class Solution {
    public List<int[]> merge(int[][] intervals) {
        if (intervals.length <= 1) {
            List<int[]> res = new ArrayList<>();
            for (int[] inv : intervals) res.add(inv);
            return res;
        }

        List<int[]> merged = new ArrayList<>();
        merged.add(intervals[0]);
        for (int i = 1; i < intervals.length; i++) {
            int[] prev = merged.get(merged.size() - 1);
            int[] curr = intervals[i];
            if (curr[0] <= prev[1]) {
                prev[1] = Math.max(prev[1], curr[1]);
            } else {
                merged.add(curr);
            }
        }
        return merged;
    }
}

//{ Driver Code Starts
// Initial Template for Java
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[][] intervals = new int[n][2];
        for (int i = 0; i < n; i++) {
            intervals[i][0] = sc.nextInt();
            intervals[i][1] = sc.nextInt();
        }

        Solution solution = new Solution();
        List<int[]> merged = solution.merge(intervals);

        for (int[] p : merged) {
            System.out.println(p[0] + " " + p[1]);
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
