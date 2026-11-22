import type { DsaProblem } from "@debugLabs/shared";
import { loadProblemTestCases } from "../testcases/loader.js";

const { testCases, hiddenTestCases } = loadProblemTestCases("coin-change");

export const COIN_CHANGE_PROBLEM: DsaProblem = {
  id: "coin-change",
  title: "Coin Change",
  difficulty: "Medium",
  category: "Dynamic Programming",
  tags: ["Array", "Dynamic Programming", "Debugging"],
  entrypointMethod: "coinChange",
  description: `Given coins of different denominations and an integer \`amount\`, find the fewest number of coins needed to make up that amount. If that amount cannot be made up, return \`-1\`.

**Input Format:**
- Line 1: \`n amount\`
- Line 2: \`n\` integers representing coin values

**Output Format:**
- Print the minimum number of coins, or \`-1\`.`,
  bugDescription:
    "The dynamic programming array `dp` is initialized with 0 instead of infinity (amount + 1). Because 0 is smaller than any coin count, `min(dp[a], dp[a - coin] + 1)` always chooses 0.",
  hints: [
    "Initialize DP entries with infinity (or `amount + 1`), not 0.",
    "Keep base case `dp[0] = 0`.",
  ],
  examples: [
    {
      id: 1,
      input: "3 11\n1 2 5",
      output: "3",
    },
    {
      id: 2,
      input: "1 3\n2",
      output: "-1",
    },
    {
      id: 3,
      input: "1 0\n1",
      output: "0",
    },
  ],
  constraints: [
    "1 <= coins.length <= 12",
    "1 <= coins[i] <= 10^4",
    "0 <= amount <= 10^4",
  ],
  starterCode: {
    javascript: `import fs from "node:fs";

function main() {
  const input = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);
  if (!input[0]) return;
  const n = parseInt(input[0], 10);
  const amount = parseInt(input[1], 10);
  const coins = input.slice(2, 2 + n).map(Number);

  // BUG: Initialized with 0 instead of infinity (amount + 1)
  const dp = new Array(amount + 1).fill(0);
  dp[0] = 0;

  for (let a = 1; a <= amount; a++) {
    for (const coin of coins) {
      if (a - coin >= 0) {
        dp[a] = Math.min(dp[a], dp[a - coin] + 1);
      }
    }
  }

  console.log(dp[amount] > amount ? -1 : dp[amount]);
}

main();
`,
    python: `import sys

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    amount = int(input_data[1])
    coins = [int(x) for x in input_data[2:2 + n]]

    # BUG: Initialized with 0 instead of float('inf')
    dp = [0] * (amount + 1)
    dp[0] = 0

    for a in range(1, amount + 1):
        for c in coins:
            if a - c >= 0:
                dp[a] = min(dp[a], dp[a - c] + 1)

    print(-1 if dp[amount] > amount else dp[amount])

if __name__ == "__main__":
    main()
`,
    cpp: `#include <iostream>
#include <vector>
#include <algorithm>
using namespace std;

int main() {
    int n, amount;
    if (!(cin >> n >> amount)) return 0;
    vector<int> coins(n);
    for (int i = 0; i < n; i++) cin >> coins[i];

    // BUG: Initialized with 0 instead of infinity (amount + 1)
    vector<int> dp(amount + 1, 0);
    dp[0] = 0;

    for (int a = 1; a <= amount; a++) {
        for (int c : coins) {
            if (a - c >= 0) {
                dp[a] = min(dp[a], dp[a - c] + 1);
            }
        }
    }

    cout << (dp[amount] > amount ? -1 : dp[amount]) << "\\n";
    return 0;
}
`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int amount = sc.nextInt();
        int[] coins = new int[n];
        for (int i = 0; i < n; i++) {
            coins[i] = sc.nextInt();
        }

        // BUG: Initialized with 0 instead of infinity (amount + 1)
        int[] dp = new int[amount + 1];
        dp[0] = 0;

        for (int a = 1; a <= amount; a++) {
            for (int c : coins) {
                if (a - c >= 0) {
                    dp[a] = Math.min(dp[a], dp[a - c] + 1);
                }
            }
        }

        System.out.println(dp[amount] > amount ? -1 : dp[amount]);
    }
}
`,
  },
  testCases,
  hiddenTestCases,
  timeLimitMs: 2000,
  memoryLimitMb: 256,
};
