import type { DsaProblem } from "@debugLabs/shared";

export const MERGE_INTERVALS_PROBLEM: DsaProblem = {
  id: "merge-intervals",
  title: "Merge Intervals",
  difficulty: "Medium",
  category: "Intervals",
  tags: ["Array", "Sorting", "Debugging"],
  description: `Given an array of \`intervals\` where \`intervals[i] = [start_i, end_i]\`, merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.`,
  bugDescription:
    "The author iterates through intervals assuming they are already sorted by start time. When unsorted inputs like `[[1, 4], [0, 4]]` are provided, intervals that should merge are wrongly appended as disjoint entries.",
  hints: [
    "Sort the intervals by their start time before merging.",
    "Compare each interval's start with the end of the last merged interval: if `current.start <= last.end`, update `last.end = max(last.end, current.end)`.",
  ],
  examples: [
    {
      id: 1,
      input: "intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]",
      output: "[[1, 6], [8, 10], [15, 18]]",
      explanation: "Since intervals [1, 3] and [2, 6] overlap, merge them into [1, 6].",
    },
    {
      id: 2,
      input: "intervals = [[1, 4], [4, 5]]",
      output: "[[1, 5]]",
      explanation: "Intervals [1, 4] and [4, 5] are considered overlapping.",
    },
  ],
  constraints: [
    "1 <= intervals.length <= 10^4",
    "intervals[i].length == 2",
    "0 <= start_i <= end_i <= 10^4",
  ],
  starterCode: {
    javascript: `/**
 * @param {number[][]} intervals
 * @return {number[][]}
 */
function merge(intervals) {
  if (intervals.length === 0) return [];

  // BUG: Forgot to sort intervals by start time first! Fails on unsorted inputs!
  const merged = [intervals[0]];

  for (let i = 1; i < intervals.length; i++) {
    const current = intervals[i];
    const last = merged[merged.length - 1];

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}
`,
    python: `from typing import List

class Solution:
    def merge(self, intervals: List[List[int]]) -> List[List[int]]:
        if not intervals:
            return []

        # BUG: Forgot to sort intervals by start time first!
        merged = [intervals[0]]
        for current in intervals[1:]:
            last = merged[-1]
            if current[0] <= last[1]:
                last[1] = max(last[1], current[1])
            else:
                merged.append(current)

        return merged
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    vector<vector<int>> merge(vector<vector<int>>& intervals) {
        if (intervals.empty()) return {};

        // BUG: Forgot to sort intervals by start time!
        vector<vector<int>> merged;
        merged.push_back(intervals[0]);

        for (size_t i = 1; i < intervals.size(); i++) {
            auto& last = merged.back();
            if (intervals[i][0] <= last[1]) {
                last[1] = max(last[1], intervals[i][1]);
            } else {
                merged.push_back(intervals[i]);
            }
        }

        return merged;
    }
};
`,
    java: `import java.util.ArrayList;
import java.util.List;

class Solution {
    public int[][] merge(int[][] intervals) {
        if (intervals.length == 0) return new int[0][0];

        // BUG: Forgot to sort intervals by start time!
        List<int[]> merged = new ArrayList<>();
        merged.add(intervals[0]);

        for (int i = 1; i < intervals.length; i++) {
            int[] last = merged.get(merged.size() - 1);
            if (intervals[i][0] <= last[1]) {
                last[1] = Math.max(last[1], intervals[i][1]);
            } else {
                merged.add(intervals[i]);
            }
        }

        return merged.toArray(new int[merged.size()][]);
    }
}
`,
  },
  testCases: [
    {
      id: "tc-1",
      name: "Case 1",
      input: "intervals = [[1, 3], [2, 6], [8, 10], [15, 18]]",
      expectedOutput: "[[1, 6], [8, 10], [15, 18]]",
    },
    {
      id: "tc-2",
      name: "Case 2",
      input: "intervals = [[1, 4], [4, 5]]",
      expectedOutput: "[[1, 5]]",
    },
  ],
  hiddenTestCases: [
    {
      id: "htc-1",
      name: "Hidden Case 1",
      input: "intervals = [[1, 4], [0, 4]]",
      expectedOutput: "[[0, 4]]",
      hidden: true,
    },
    {
      id: "htc-2",
      name: "Hidden Case 2",
      input: "intervals = [[1, 4], [0, 2], [3, 5]]",
      expectedOutput: "[[0, 5]]",
      hidden: true,
    },
  ],
};
