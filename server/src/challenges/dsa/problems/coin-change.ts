import type { DsaProblem } from "@debugLabs/shared";

export const COIN_CHANGE_PROBLEM: DsaProblem = {
  id: "coin-change",
  title: "Coin Change",
  difficulty: "Medium",
  category: "Dynamic Programming",
  tags: ["Array", "Dynamic Programming", "Debugging"],
  description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return \`-1\`.

You may assume that you have an infinite number of each kind of coin.`,
  bugDescription:
    "The dynamic programming array `dp` is initialized with `0` instead of infinity. Because `0` is smaller than any coin count, `Math.min(dp[a], dp[a - coin] + 1)` always chooses `0`, failing all valid combinations.",
  hints: [
    "When computing minimum values with dynamic programming, initialize the table entries with infinity (or `amount + 1`), not 0.",
    "Ensure the base case `dp[0] = 0` (0 coins needed to make amount 0).",
    "Return `dp[amount]` if it was reachable, otherwise return `-1`.",
  ],
  examples: [
    {
      id: 1,
      input: "coins = [1, 2, 5], amount = 11",
      output: "3",
      explanation: "11 = 5 + 5 + 1",
    },
    {
      id: 2,
      input: "coins = [2], amount = 3",
      output: "-1",
    },
    {
      id: 3,
      input: "coins = [1], amount = 0",
      output: "0",
    },
  ],
  constraints: [
    "1 <= coins.length <= 12",
    "1 <= coins[i] <= 2^31 - 1",
    "0 <= amount <= 10^4",
  ],
  starterCode: {
    javascript: `/**
 * @param {number[]} coins
 * @param {number} amount
 * @return {number}
 */
function coinChange(coins, amount) {
  // BUG: Initializing with 0 causes Math.min to always remain 0!
  const dp = new Array(amount + 1).fill(0);

  for (let a = 1; a <= amount; a++) {
    for (const c of coins) {
      if (a - c >= 0) {
        dp[a] = Math.min(dp[a], dp[a - c] + 1);
      }
    }
  }

  return dp[amount] !== 0 ? dp[amount] : -1;
}
`,
    python: `from typing import List

class Solution:
    def coinChange(self, coins: List[int], amount: int) -> int:
        # BUG: Initializing with 0 causes min() to always stay 0!
        dp = [0] * (amount + 1)

        for a in range(1, amount + 1):
            for c in coins:
                if a - c >= 0:
                    dp[a] = min(dp[a], dp[a - c] + 1)

        return dp[amount] if dp[amount] != 0 else -1
`,
    cpp: `#include <vector>
#include <algorithm>
using namespace std;

class Solution {
public:
    int coinChange(vector<int>& coins, int amount) {
        // BUG: Initializing with 0 causes min() to always pick 0!
        vector<int> dp(amount + 1, 0);

        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (a - c >= 0) {
                    dp[a] = min(dp[a], dp[a - c] + 1);
                }
            }
        }

        return dp[amount] != 0 ? dp[amount] : -1;
    }
};
`,
    java: `import java.util.Arrays;

class Solution {
    public int coinChange(int[] coins, int amount) {
        // BUG: Initializing with 0 causes Math.min to always stay 0!
        int[] dp = new int[amount + 1];

        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (a - c >= 0) {
                    dp[a] = Math.min(dp[a], dp[a - c] + 1);
                }
            }
        }

        return dp[amount] != 0 ? dp[amount] : -1;
    }
}
`,
  },
  testCases: [
    {
      id: "tc-1",
      name: "Case 1",
      input: "coins = [1, 2, 5], amount = 11",
      expectedOutput: "3",
    },
    {
      id: "tc-2",
      name: "Case 2",
      input: "coins = [2], amount = 3",
      expectedOutput: "-1",
    },
    {
      id: "tc-3",
      name: "Case 3",
      input: "coins = [1], amount = 0",
      expectedOutput: "0",
    },
  ],
  hiddenTestCases: [
    {
      id: "htc-1",
      name: "Hidden Case 1",
      input: "coins = [1, 3, 4], amount = 6",
      expectedOutput: "2",
      hidden: true,
    },
    {
      id: "htc-2",
      name: "Hidden Case 2",
      input: "coins = [2], amount = 4",
      expectedOutput: "2",
      hidden: true,
    },
  ],
};
