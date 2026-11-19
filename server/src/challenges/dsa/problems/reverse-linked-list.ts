import type { DsaProblem } from "@debugLabs/shared";

export const REVERSE_LINKED_LIST_PROBLEM: DsaProblem = {
  id: "reverse-linked-list",
  title: "Reverse Linked List",
  difficulty: "Easy",
  category: "Linked List",
  tags: ["Linked List", "Recursion", "Debugging"],
  description: `Given the \`head\` of a singly linked list, reverse the list, and return the reversed list.`,
  bugDescription:
    "In the reversal loop, `curr.next = prev` is reassigned before saving a reference to the remaining list, severing pointers and causing immediate truncation or infinite loops.",
  hints: [
    "Always store `next_node = curr.next` in a temporary variable before overwriting `curr.next`.",
    "Advance `prev = curr` and `curr = next_node`.",
    "Return `prev` as the new head of the reversed list.",
  ],
  examples: [
    {
      id: 1,
      input: "head = [1, 2, 3, 4, 5]",
      output: "[5, 4, 3, 2, 1]",
    },
    {
      id: 2,
      input: "head = [1, 2]",
      output: "[2, 1]",
    },
    {
      id: 3,
      input: "head = []",
      output: "[]",
    },
  ],
  constraints: [
    "The number of nodes in the list is the range [0, 5000].",
    "-5000 <= Node.val <= 5000",
  ],
  starterCode: {
    javascript: `/**
 * Definition for singly-linked list.
 * function ListNode(val, next) {
 *     this.val = (val===undefined ? 0 : val)
 *     this.next = (next===undefined ? null : next)
 * }
 */
/**
 * @param {ListNode} head
 * @return {ListNode}
 */
function reverseList(head) {
  let prev = null;
  let curr = head;

  while (curr) {
    // BUG: curr.next is overwritten BEFORE saving next node reference!
    curr.next = prev;
    prev = curr;
    curr = curr.next; // Already prev! Causes infinite loop / truncation!
  }

  return prev;
}
`,
    python: `from typing import Optional

# Definition for singly-linked list.
# class ListNode:
#     def __init__(self, val=0, next=None):
#         self.val = val
#         self.next = next
class Solution:
    def reverseList(self, head: Optional[ListNode]) -> Optional[ListNode]:
        prev = None
        curr = head

        while curr:
            # BUG: curr.next is modified before saving reference to rest of list!
            curr.next = prev
            prev = curr
            curr = curr.next  # BUG: curr.next is now prev!

        return prev
`,
    cpp: `/**
 * Definition for singly-linked list.
 * struct ListNode {
 *     int val;
 *     ListNode *next;
 *     ListNode() : val(0), next(nullptr) {}
 *     ListNode(int x) : val(x), next(nullptr) {}
 *     ListNode(int x, ListNode *next) : val(x), next(next) {}
 * };
 */
class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        ListNode* curr = head;

        while (curr != nullptr) {
            // BUG: overwrites curr->next before preserving next pointer!
            curr->next = prev;
            prev = curr;
            curr = curr->next;
        }

        return prev;
    }
};
`,
    java: `/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode() {}
 *     ListNode(int val) { this.val = val; }
 *     ListNode(int val, ListNode next) { this.val = val; this.next = next; }
 * }
 */
class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        ListNode curr = head;

        while (curr != null) {
            // BUG: overwrites curr.next before preserving reference to rest of list!
            curr.next = prev;
            prev = curr;
            curr = curr.next;
        }

        return prev;
    }
}
`,
  },
  testCases: [
    {
      id: "tc-1",
      name: "Case 1",
      input: "head = [1, 2, 3, 4, 5]",
      expectedOutput: "[5, 4, 3, 2, 1]",
    },
    {
      id: "tc-2",
      name: "Case 2",
      input: "head = [1, 2]",
      expectedOutput: "[2, 1]",
    },
    {
      id: "tc-3",
      name: "Case 3",
      input: "head = []",
      expectedOutput: "[]",
    },
  ],
  hiddenTestCases: [
    {
      id: "htc-1",
      name: "Hidden Case 1",
      input: "head = [9, 8, 7]",
      expectedOutput: "[7, 8, 9]",
      hidden: true,
    },
    {
      id: "htc-2",
      name: "Hidden Case 2",
      input: "head = [4]",
      expectedOutput: "[4]",
      hidden: true,
    },
  ],
};
