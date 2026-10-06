# Learning order for all 169 problems

Reordered on 2026-10-05. This is a prerequisite-aware learning sequence tailored to a learner with the original first 26 already recorded, not a universal ranking or a claim about interview frequency. All 169 original problems remain; IDs, URLs, time estimates, supplied difficulty labels, and legacy week metadata are unchanged. The first 26 remain in place to preserve the existing foundation and first-ten onboarding import. New practice begins with House Robber, Maximum Subarray, Subarray Sum Equals K, Min Stack, and Daily Temperatures.

## Original order and restoration

[original-problems.json](original-problems.json) is an exact copy of the pre-change catalog, including the original order and 15-week grouping. It is a historical snapshot, not the active curriculum. To restore the original sequence, copy it over src/problems.json, review the curriculum-specific tests and documentation, then test, commit, push, and deploy normally. Do not replace any account progress to restore an order: progress is keyed by stable problem IDs.

## Reasoning and double-check

- Cover missing graph, DP, backtracking and heap foundations early, rather than finishing all Easies first.
- Use short related runs to learn a technique, then return to it through later variations. Existing completed items are skipped for new assignments; due reviews still take priority.
- DP starts with House Robber and Maximum Subarray. Unique Paths and Decode Ways precede segmentation and subset knapsack; binary-search practice breaks up the longer DP block.
- Learn basic BFS before implicit graphs, directed cycle detection before topological ordering, and connectivity before Accounts Merge. Use union-find for the latter to broaden coverage.
- Learn K Closest Points and Top K Frequent Words using heaps. Kth Largest adds selection practice; Merge k Sorted Lists precedes the two-heap invariant of streaming median.
- Practice Subsets and Permutations before more elaborate search. Word Search and wildcard trie search precede Word Search II; N-Queens precedes Sudoku Solver.
- Tree level order, validation and LCA precede reconstruction and serialization. Path Sum II and the existing Diameter exercise prepare tree path reasoning before Maximum Path Sum.
- Stack evaluation precedes nested parsing and calculators; Daily Temperatures precedes monotonic deque/histogram applications.
- Interleave advanced challenges with easier reinforcement instead of a final uninterrupted block of 26 Hards. The hardest specialized combinations remain late.
- An independent review examined all 169 positions. Revisions addressed late introductory exercises, heap/DP progression, and long runs of Hards. Automated checks cover identity/metadata preservation, key learning dependencies, and existing-state compatibility.

Order cannot alone test unfamiliar problem-solving: periodically attempt a mixed problem without looking at its pattern or solution. These entries carry no new solution hints in the practice UI.

## Complete sequence

| New position | Problem                                                   | Original position |
| -----------: | --------------------------------------------------------- | ----------------: |
|            1 | Two Sum                                                   |                 1 |
|            2 | Valid Parentheses                                         |                 2 |
|            3 | Merge Two Sorted Lists                                    |                 3 |
|            4 | Best Time to Buy and Sell Stock                           |                 4 |
|            5 | Valid Palindrome                                          |                 5 |
|            6 | Invert Binary Tree                                        |                 6 |
|            7 | Valid Anagram                                             |                 7 |
|            8 | Binary Search                                             |                 8 |
|            9 | Flood Fill                                                |                 9 |
|           10 | Lowest Common Ancestor of a Binary Search Tree            |                10 |
|           11 | Balanced Binary Tree                                      |                11 |
|           12 | Linked List Cycle                                         |                12 |
|           13 | Implement Queue using Stacks                              |                13 |
|           14 | First Bad Version                                         |                14 |
|           15 | Ransom Note                                               |                15 |
|           16 | Climbing Stairs                                           |                16 |
|           17 | Longest Palindrome                                        |                17 |
|           18 | Reverse Linked List                                       |                18 |
|           19 | Majority Element                                          |                19 |
|           20 | Add Binary                                                |                20 |
|           21 | Diameter of Binary Tree                                   |                21 |
|           22 | Middle of the Linked List                                 |                22 |
|           23 | Maximum Depth of Binary Tree                              |                23 |
|           24 | Contains Duplicate                                        |                24 |
|           25 | Meeting Rooms                                             |                25 |
|           26 | Roman to Integer                                          |                26 |
|           27 | House Robber                                              |                85 |
|           28 | Maximum Subarray                                          |                42 |
|           29 | Subarray Sum Equals K                                     |               117 |
|           30 | Min Stack                                                 |                55 |
|           31 | Daily Temperatures                                        |                84 |
|           32 | Binary Tree Level Order Traversal                         |                48 |
|           33 | Validate Binary Search Tree                               |                56 |
|           34 | Number of Islands                                         |                57 |
|           35 | Clone Graph                                               |                49 |
|           36 | Rotting Oranges                                           |                58 |
|           37 | 01 Matrix                                                 |                44 |
|           38 | Letter Combinations of a Phone Number                     |                77 |
|           39 | Subsets                                                   |                71 |
|           40 | Permutations                                              |                61 |
|           41 | Combination Sum                                           |                60 |
|           42 | Coin Change                                               |                53 |
|           43 | Jump Game                                                 |               111 |
|           44 | K Closest Points to Origin                                |                45 |
|           45 | Top K Frequent Words                                      |                96 |
|           46 | Course Schedule                                           |                51 |
|           47 | Course Schedule II                                        |                99 |
|           48 | Non-overlapping Intervals                                 |               143 |
|           49 | Implement Trie (Prefix Tree)                              |                52 |
|           50 | Group Anagrams                                            |                89 |
|           51 | Product of Array Except Self                              |                54 |
|           52 | Longest Consecutive Sequence                              |               102 |
|           53 | Longest Substring Without Repeating Characters            |                46 |
|           54 | Longest Repeating Character Replacement                   |               109 |
|           55 | Find All Anagrams in a String                             |                79 |
|           56 | 3Sum                                                      |                47 |
|           57 | Container With Most Water                                 |                76 |
|           58 | Merge Intervals                                           |                62 |
|           59 | Insert Interval                                           |                43 |
|           60 | Same Tree                                                 |                29 |
|           61 | Subtree of Another Tree                                   |                40 |
|           62 | Kth Smallest Element in a BST                             |                83 |
|           63 | Lowest Common Ancestor of a Binary Tree                   |                63 |
|           64 | Remove Nth Node From End of List                          |                93 |
|           65 | Add Two Numbers                                           |               112 |
|           66 | Reorder List                                              |               133 |
|           67 | Graph Valid Tree                                          |                98 |
|           68 | Number of Connected Components in an Undirected Graph     |               115 |
|           69 | Accounts Merge                                            |                65 |
|           70 | Generate Parentheses                                      |               113 |
|           71 | Word Search                                               |                78 |
|           72 | Unique Paths                                              |                74 |
|           73 | Decode Ways                                               |               129 |
|           74 | Word Break                                                |                67 |
|           75 | Time Based Key-Value Store                                |                64 |
|           76 | Search a 2D Matrix                                        |               127 |
|           77 | Partition Equal Subset Sum                                |                68 |
|           78 | Maximum Product Subarray                                  |                90 |
|           79 | Longest Increasing Subsequence                            |                97 |
|           80 | Find Minimum in Rotated Sorted Array                      |               139 |
|           81 | Search in Rotated Sorted Array                            |                59 |
|           82 | Meeting Rooms II                                          |               130 |
|           83 | Pacific Atlantic Water Flow                               |                92 |
|           84 | Kth Largest Element in an Array                           |               120 |
|           85 | LRU Cache                                                 |                82 |
|           86 | Encode and Decode Strings                                 |               134 |
|           87 | Evaluate Reverse Polish Notation                          |                50 |
|           88 | Decode String                                             |               105 |
|           89 | Spiral Matrix                                             |                70 |
|           90 | Set Matrix Zeroes                                         |               132 |
|           91 | Sort Colors                                               |                66 |
|           92 | Minimum Window Substring                                  |               144 |
|           93 | Construct Binary Tree from Preorder and Inorder Traversal |                75 |
|           94 | Single Number                                             |                32 |
|           95 | Serialize and Deserialize Binary Tree                     |               145 |
|           96 | Random Pick with Weight                                   |               119 |
|           97 | Maximum Frequency Stack                                   |               154 |
|           98 | Longest Palindromic Substring                             |                73 |
|           99 | Path Sum II                                               |               101 |
|          100 | Binary Tree Maximum Path Sum                              |               153 |
|          101 | Number of 1 Bits                                          |                30 |
|          102 | Design Add and Search Words Data Structure                |                91 |
|          103 | N-Queens                                                  |               168 |
|          104 | Move Zeroes                                               |                34 |
|          105 | Merge k Sorted Lists                                      |               151 |
|          106 | Insert Delete GetRandom O(1)                              |               142 |
|          107 | Employee Free Time                                        |               159 |
|          108 | Counting Bits                                             |                28 |
|          109 | Find Median from Data Stream                              |               147 |
|          110 | Squares of a Sorted Array                                 |                41 |
|          111 | Binary Tree Right Side View                               |                72 |
|          112 | Path Sum III                                              |               125 |
|          113 | Backspace String Compare                                  |                27 |
|          114 | Palindrome Linked List                                    |                33 |
|          115 | Symmetric Tree                                            |                35 |
|          116 | Convert Sorted Array to Binary Search Tree                |                38 |
|          117 | Contiguous Array                                          |               106 |
|          118 | Asteroid Collision                                        |               118 |
|          119 | Task Scheduler                                            |                81 |
|          120 | Gas Station                                               |                86 |
|          121 | Missing Number                                            |                36 |
|          122 | Find the Duplicate Number                                 |                95 |
|          123 | Sort List                                                 |               114 |
|          124 | Maximal Square                                            |               121 |
|          125 | Combination Sum IV                                        |               141 |
|          126 | Cheapest Flights Within K Stops                           |               135 |
|          127 | Shortest Path to Get Food                                 |                94 |
|          128 | Word Ladder                                               |               148 |
|          129 | All Nodes Distance K in Binary Tree                       |               136 |
|          130 | Alien Dictionary                                          |               161 |
|          131 | Find K Closest Elements                                   |               108 |
|          132 | Sliding Window Maximum                                    |               163 |
|          133 | Rotate Image                                              |               122 |
|          134 | Trapping Rain Water                                       |               146 |
|          135 | Maximum Width of Binary Tree                              |               107 |
|          136 | Largest Rectangle in Histogram                            |               152 |
|          137 | Binary Tree Zigzag Level Order Traversal                  |               123 |
|          138 | Longest Increasing Path in a Matrix                       |               156 |
|          139 | Inorder Successor in BST                                  |               110 |
|          140 | Word Search II                                            |               160 |
|          141 | Longest Common Prefix                                     |                31 |
|          142 | Maximum Profit in Job Scheduling                          |               150 |
|          143 | Palindrome Number                                         |                37 |
|          144 | Smallest Range Covering Elements from K Lists             |               169 |
|          145 | Design Hit Counter                                        |               124 |
|          146 | Design In-Memory File System                              |               158 |
|          147 | Reverse Bits                                              |                39 |
|          148 | Valid Sudoku                                              |                88 |
|          149 | Sudoku Solver                                             |               166 |
|          150 | Rotate Array                                              |               103 |
|          151 | Minimum Knight Moves                                      |               116 |
|          152 | Swap Nodes in Pairs                                       |               100 |
|          153 | Reverse Nodes in k-Group                                  |               165 |
|          154 | Odd Even Linked List                                      |               104 |
|          155 | Rotate List                                               |               138 |
|          156 | 3Sum Closest                                              |               137 |
|          157 | String to Integer (atoi)                                  |                69 |
|          158 | Basic Calculator II                                       |               140 |
|          159 | Longest Valid Parentheses                                 |               157 |
|          160 | Basic Calculator                                          |               149 |
|          161 | Pow(x, n)                                                 |               126 |
|          162 | Next Permutation                                          |                87 |
|          163 | First Missing Positive                                    |               167 |
|          164 | Minimum Height Trees                                      |                80 |
|          165 | Bus Routes                                                |               162 |
|          166 | Largest Number                                            |               128 |
|          167 | Median of Two Sorted Arrays                               |               155 |
|          168 | Reverse Integer                                           |               131 |
|          169 | Palindrome Pairs                                          |               164 |
