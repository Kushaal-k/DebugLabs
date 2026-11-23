import type { DsaProblem } from "@debugLabs/shared";
import { loadProblemTestCases } from "../testcases/loader.js";

const { testCases, hiddenTestCases } = loadProblemTestCases("reverse-linked-list");

export const REVERSE_LINKED_LIST_PROBLEM: DsaProblem = {
  id: "reverse-linked-list",
  title: "Reverse Linked List",
  difficulty: "Easy",
  category: "Linked List",
  tags: ["Linked List", "Recursion", "Debugging"],
  entrypointMethod: "reverseList",
  description: `Given the elements of a singly linked list, reverse the linked list, and print the reversed values.

**Input Format:**
- Line 1: \`n\` (the number of elements in the list)
- Line 2: \`n\` integers separated by spaces (if \`n > 0\`)

**Output Format:**
- Print the reversed elements separated by spaces (or an empty line if \`n == 0\`).`,
  bugDescription:
    "In the reversal loop, `curr.next = prev` is reassigned before saving a reference to the remaining list, breaking the chain prematurely.",
  hints: [
    "Always store `next_node = curr.next` before overwriting `curr.next`.",
    "Advance `prev = curr` and `curr = next_node`.",
  ],
  examples: [
    {
      id: 1,
      input: "5\n1 2 3 4 5",
      output: "5 4 3 2 1",
    },
    {
      id: 2,
      input: "2\n1 2",
      output: "2 1",
    },
    {
      id: 3,
      input: "0",
      output: "",
    },
  ],
  constraints: [
    "0 <= n <= 5000",
    "-5000 <= val <= 5000",
  ],
  starterCode: {
    javascript: `/**
 * function ListNode(val, next) {
 *   this.val = (val===undefined ? 0 : val);
 *   this.next = (next===undefined ? null : next);
 * }
 */

class Solution {
  /**
   * @param {ListNode} head
   * @return {ListNode}
   */
  reverseList(head) {
    let prev = null;
    let curr = head;
    while (curr) {
      const next = curr.next;
      curr.next = prev;
      prev = curr;
      curr = next;
    }
    return prev;
  }
}

//{ Driver Code Starts
// Initial Template for javascript
import fs from "node:fs";

function ListNode(val, next) {
  this.val = val;
  this.next = next || null;
}

function main() {
  const input = fs.readFileSync(0, "utf-8").trim().split(/\\s+/);
  if (!input[0] || input[0] === "") return;
  const n = parseInt(input[0], 10);
  if (n <= 0) return;

  const vals = input.slice(1, 1 + n).map(Number);
  const head = new ListNode(vals[0]);
  let cur = head;
  for (let i = 1; i < vals.length; i++) {
    cur.next = new ListNode(vals[i]);
    cur = cur.next;
  }

  const solution = new Solution();
  const prev = solution.reverseList(head);

  const res = [];
  let p = prev;
  while (p) {
    res.push(p.val);
    p = p.next;
  }
  console.log(res.join(" "));
}

main();
//} Driver Code Ends
`,
    python: `# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next

class Solution:
    def reverseList(self, head):
        prev = None
        curr = head
        while curr:
            next_node = curr.next
            curr.next = prev
            prev = curr
            curr = next_node
        return prev

# { Driver Code Starts
# Initial Template for python3
import sys

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def main():
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    n = int(input_data[0])
    if n <= 0:
        return

    vals = [int(x) for x in input_data[1:1 + n]]
    head = ListNode(vals[0])
    cur = head
    for v in vals[1:]:
        cur.next = ListNode(v)
        cur = cur.next

    solution = Solution()
    prev = solution.reverseList(head)

    res = []
    p = prev
    while p:
        res.append(str(p.val))
        p = p.next
    print(" ".join(res))

if __name__ == "__main__":
    main()
# } Driver Code Ends
`,
    cpp: `struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;
        while (curr) {
            ListNode* next = curr->next;
            curr->next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
    }
};

//{ Driver Code Starts
// Initial Template for C++
#include <iostream>
#include <vector>
using namespace std;

int main() {
    int n;
    if (!(cin >> n) || n <= 0) return 0;

    ListNode* head = nullptr;
    ListNode* tail = nullptr;
    for (int i = 0; i < n; i++) {
        int x;
        cin >> x;
        ListNode* node = new ListNode(x);
        if (!head) head = tail = node;
        else { tail->next = node; tail = node; }
    }

    Solution solution;
    ListNode* prev = solution.reverseList(head);

    bool first = true;
    for (ListNode* p = prev; p != nullptr; p = p->next) {
        if (!first) cout << " ";
        cout << p->val;
        first = false;
    }
    cout << "\\n";
    return 0;
}
//} Driver Code Ends
`,
    java: `class ListNode {
    int val;
    ListNode next;
    ListNode(int val) { this.val = val; }
}

class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;
        while (curr != null) {
            ListNode next = curr.next;
            curr.next = prev;
            prev = curr;
            curr = next;
        }
        return prev;
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
        if (n <= 0) return;

        ListNode head = new ListNode(sc.nextInt());
        ListNode cur = head;
        for (int i = 1; i < n; i++) {
            cur.next = new ListNode(sc.nextInt());
            cur = cur.next;
        }

        Solution solution = new Solution();
        ListNode prev = solution.reverseList(head);

        StringBuilder sb = new StringBuilder();
        for (ListNode p = prev; p != null; p = p.next) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(p.val);
        }
        System.out.println(sb.toString());
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
