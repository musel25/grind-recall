# Grind 75 + Bloomberg learning order

The active plan contains the user's exact 75 Grind problems and exact 57 Bloomberg Thirty Days entries: 17 overlap, leaving **115 unique problems**. Every account also retains its previously practiced extras. Unrated morning-study items remain active so in-flight study is not lost. The other original problems are archived, searchable and linked from the Archive view; they are excluded from new assignments and forecasts.

The [source manifest](focused-sources.json) preserves membership and the pasted Bloomberg frequencies. This is the user's historical snapshot, not a claim about current Bloomberg interview frequency. It includes all three SQL entries. New problems absent from the original catalog use clearly estimated solve times: Easy 20, Medium 30, Hard 45 minutes; first-pass study remains twice solve time. Existing estimates and stable IDs are unchanged.

## Learning rationale

This is a pedagogical sequence, not a mathematically proven optimal ordering. Frequency is not used to move a problem ahead of its prerequisites. Short topic runs establish a technique; later stages return to it in more complex combinations. Due reviews remain first and provide spaced interleaving. New assignments follow the numbered sequence and do not skip ahead just to fill unused minutes.

- Arrays and hash maps establish scans, lookup invariants and counting; pointers and windows build on those before harder coverage windows.
- Reverse, merge, midpoint and cycle detection precede sublist reversal, reorder and cache design. Stack interfaces precede nested parsing, greedy stack choices and calculators.
- Binary search and intervals precede rotated searches, time-based lookup, weighted scheduling, answer-space search and partitioning two sorted arrays.
- Tree recursion precedes level-order, vertical traversal, BST invariants, reconstruction and serialization. Grid traversal precedes multi-source BFS and implicit word graphs.
- Fibonacci, stairs and house robbery teach recurrence/state before coin change, word segmentation, subset knapsack, weighted scheduling and game states.
- Subsets and permutations precede combination search; basic grid backtracking and trie insertion precede optional combined trie search.
- Connectivity precedes account merging and ratio graphs; directed cycles precede optional topological sorting and leaf-pruning applications.
- A heap-selection problem precedes multiway merge and streaming median. Greedy and stack work precedes rain-water/histogram invariants; binary-search foundations precede the final harder search problems.
- SQL has its own final sequence: filtering, distinct rows, then grouped retention. These entries are retained exactly because the user supplied them; no inference is made about their relevance to a particular SWE interview.

Optional practiced extras occupy related positions in the full catalog rather than an appended miscellaneous block. The 115 base problems do not rely on completing archived exercises: optional exercises reinforce a topic but are not required. Numbering is contiguous for each account's active list, so adding a retained extra shifts later displayed numbers without altering any progress keys. Imported first-ten onboarding uses explicit historical IDs, independent of curriculum positions.

## Preservation and archive

[original-problems.json](original-problems.json) remains the immutable original 169-problem snapshot. All 169 IDs still exist in the complete 194-entry catalog (169 original + 25 new Bloomberg entries). Backups and history validate against the full catalog; the queue, roadmap and forecast use the active subset. No account progress, ratings, notes, dates or history are rewritten by this catalog change. Existing accounts need only reload. Practiced extras remain active per account, including failed attempts, and retain due reviews. Untouched archived entries never auto-enter new work, including stale daily-extra selections from an older plan.

## Base sequence (115 problems)

Account-specific extras are inserted into their related stages. The live app is authoritative for an account's final numbering.

| Position | Problem | Source | Learning stage |
| ---: | --- | --- | --- |
| 1 | [Concatenation of Array](https://leetcode.com/problems/concatenation-of-array) | Bloomberg | Array and hash-table foundations |
| 2 | [Contains Duplicate](https://leetcode.com/problems/contains-duplicate) | Grind 75 | Array and hash-table foundations |
| 3 | [Two Sum](https://leetcode.com/problems/two-sum) | Grind 75 + Bloomberg | Array and hash-table foundations |
| 4 | [Valid Anagram](https://leetcode.com/problems/valid-anagram) | Grind 75 | Array and hash-table foundations |
| 5 | [Ransom Note](https://leetcode.com/problems/ransom-note) | Grind 75 | Array and hash-table foundations |
| 6 | [Longest Palindrome](https://leetcode.com/problems/longest-palindrome) | Grind 75 | Array and hash-table foundations |
| 7 | [Majority Element](https://leetcode.com/problems/majority-element) | Grind 75 | Array and hash-table foundations |
| 8 | [Best Time to Buy and Sell Stock](https://leetcode.com/problems/best-time-to-buy-and-sell-stock) | Grind 75 + Bloomberg | Array and hash-table foundations |
| 9 | [Maximum Subarray](https://leetcode.com/problems/maximum-subarray) | Grind 75 | Array and hash-table foundations |
| 10 | [Group Anagrams](https://leetcode.com/problems/group-anagrams) | Bloomberg | Array and hash-table foundations |
| 11 | [Product of Array Except Self](https://leetcode.com/problems/product-of-array-except-self) | Grind 75 | Array and hash-table foundations |
| 12 | [Longest Consecutive Sequence](https://leetcode.com/problems/longest-consecutive-sequence) | Bloomberg | Array and hash-table foundations |
| 13 | [Valid Palindrome](https://leetcode.com/problems/valid-palindrome) | Grind 75 | Pointers and sliding windows |
| 14 | [Maximum Average Subarray I](https://leetcode.com/problems/maximum-average-subarray-i) | Bloomberg | Pointers and sliding windows |
| 15 | [Contains Duplicate II](https://leetcode.com/problems/contains-duplicate-ii) | Bloomberg | Pointers and sliding windows |
| 16 | [Longest Substring Without Repeating Characters](https://leetcode.com/problems/longest-substring-without-repeating-characters) | Grind 75 + Bloomberg | Pointers and sliding windows |
| 17 | [Find All Anagrams in a String](https://leetcode.com/problems/find-all-anagrams-in-a-string) | Grind 75 | Pointers and sliding windows |
| 18 | [Container With Most Water](https://leetcode.com/problems/container-with-most-water) | Grind 75 + Bloomberg | Pointers and sliding windows |
| 19 | [3Sum](https://leetcode.com/problems/3sum) | Grind 75 + Bloomberg | Pointers and sliding windows |
| 20 | [3Sum Closest](https://leetcode.com/problems/3sum-closest) | Bloomberg | Pointers and sliding windows |
| 21 | [Valid Triangle Number](https://leetcode.com/problems/valid-triangle-number) | Bloomberg | Pointers and sliding windows |
| 22 | [Sort Colors](https://leetcode.com/problems/sort-colors) | Grind 75 | Pointers and sliding windows |
| 23 | [Reverse Linked List](https://leetcode.com/problems/reverse-linked-list) | Grind 75 | Linked-list and stack foundations |
| 24 | [Merge Two Sorted Lists](https://leetcode.com/problems/merge-two-sorted-lists) | Grind 75 + Bloomberg | Linked-list and stack foundations |
| 25 | [Middle of the Linked List](https://leetcode.com/problems/middle-of-the-linked-list) | Grind 75 | Linked-list and stack foundations |
| 26 | [Linked List Cycle](https://leetcode.com/problems/linked-list-cycle) | Grind 75 | Linked-list and stack foundations |
| 27 | [Happy Number](https://leetcode.com/problems/happy-number) | Bloomberg | Linked-list and stack foundations |
| 28 | [Valid Parentheses](https://leetcode.com/problems/valid-parentheses) | Grind 75 | Linked-list and stack foundations |
| 29 | [Implement Queue using Stacks](https://leetcode.com/problems/implement-queue-using-stacks) | Grind 75 | Linked-list and stack foundations |
| 30 | [Min Stack](https://leetcode.com/problems/min-stack) | Grind 75 | Linked-list and stack foundations |
| 31 | [Evaluate Reverse Polish Notation](https://leetcode.com/problems/evaluate-reverse-polish-notation) | Grind 75 | Linked-list and stack foundations |
| 32 | [Simplify Path](https://leetcode.com/problems/simplify-path) | Bloomberg | Linked-list and stack foundations |
| 33 | [Binary Search](https://leetcode.com/problems/binary-search) | Grind 75 | Binary search and intervals |
| 34 | [First Bad Version](https://leetcode.com/problems/first-bad-version) | Grind 75 | Binary search and intervals |
| 35 | [Search in Rotated Sorted Array](https://leetcode.com/problems/search-in-rotated-sorted-array) | Grind 75 | Binary search and intervals |
| 36 | [Time Based Key-Value Store](https://leetcode.com/problems/time-based-key-value-store) | Grind 75 | Binary search and intervals |
| 37 | [Find K Closest Elements](https://leetcode.com/problems/find-k-closest-elements) | Bloomberg | Binary search and intervals |
| 38 | [Merge Intervals](https://leetcode.com/problems/merge-intervals) | Grind 75 + Bloomberg | Binary search and intervals |
| 39 | [Insert Interval](https://leetcode.com/problems/insert-interval) | Grind 75 | Binary search and intervals |
| 40 | [Maximum Depth of Binary Tree](https://leetcode.com/problems/maximum-depth-of-binary-tree) | Grind 75 + Bloomberg | Tree traversal and recursive invariants |
| 41 | [Invert Binary Tree](https://leetcode.com/problems/invert-binary-tree) | Grind 75 | Tree traversal and recursive invariants |
| 42 | [Balanced Binary Tree](https://leetcode.com/problems/balanced-binary-tree) | Grind 75 | Tree traversal and recursive invariants |
| 43 | [Diameter of Binary Tree](https://leetcode.com/problems/diameter-of-binary-tree) | Grind 75 | Tree traversal and recursive invariants |
| 44 | [Binary Tree Level Order Traversal](https://leetcode.com/problems/binary-tree-level-order-traversal) | Grind 75 | Tree traversal and recursive invariants |
| 45 | [Binary Tree Right Side View](https://leetcode.com/problems/binary-tree-right-side-view) | Grind 75 | Tree traversal and recursive invariants |
| 46 | [Binary Tree Vertical Order Traversal](https://leetcode.com/problems/binary-tree-vertical-order-traversal) | Bloomberg | Tree traversal and recursive invariants |
| 47 | [Validate Binary Search Tree](https://leetcode.com/problems/validate-binary-search-tree) | Grind 75 | Tree traversal and recursive invariants |
| 48 | [Kth Smallest Element in a BST](https://leetcode.com/problems/kth-smallest-element-in-a-bst) | Grind 75 | Tree traversal and recursive invariants |
| 49 | [Lowest Common Ancestor of a Binary Search Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree) | Grind 75 | Tree traversal and recursive invariants |
| 50 | [Lowest Common Ancestor of a Binary Tree](https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree) | Grind 75 | Tree traversal and recursive invariants |
| 51 | [Flood Fill](https://leetcode.com/problems/flood-fill) | Grind 75 | Graph traversal and breadth-first search |
| 52 | [Number of Islands](https://leetcode.com/problems/number-of-islands) | Grind 75 + Bloomberg | Graph traversal and breadth-first search |
| 53 | [Clone Graph](https://leetcode.com/problems/clone-graph) | Grind 75 | Graph traversal and breadth-first search |
| 54 | [Rotting Oranges](https://leetcode.com/problems/rotting-oranges) | Grind 75 | Graph traversal and breadth-first search |
| 55 | [01 Matrix](https://leetcode.com/problems/01-matrix) | Grind 75 | Graph traversal and breadth-first search |
| 56 | [Fibonacci Number](https://leetcode.com/problems/fibonacci-number) | Bloomberg | Dynamic programming foundations |
| 57 | [Climbing Stairs](https://leetcode.com/problems/climbing-stairs) | Grind 75 + Bloomberg | Dynamic programming foundations |
| 58 | [House Robber](https://leetcode.com/problems/house-robber) | Bloomberg | Dynamic programming foundations |
| 59 | [Unique Paths](https://leetcode.com/problems/unique-paths) | Grind 75 | Dynamic programming foundations |
| 60 | [Coin Change](https://leetcode.com/problems/coin-change) | Grind 75 | Dynamic programming foundations |
| 61 | [Subsets](https://leetcode.com/problems/subsets) | Grind 75 + Bloomberg | Backtracking and prefix trees |
| 62 | [Permutations](https://leetcode.com/problems/permutations) | Grind 75 + Bloomberg | Backtracking and prefix trees |
| 63 | [Letter Combinations of a Phone Number](https://leetcode.com/problems/letter-combinations-of-a-phone-number) | Grind 75 | Backtracking and prefix trees |
| 64 | [Combination Sum](https://leetcode.com/problems/combination-sum) | Grind 75 + Bloomberg | Backtracking and prefix trees |
| 65 | [Word Search](https://leetcode.com/problems/word-search) | Grind 75 | Backtracking and prefix trees |
| 66 | [Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree) | Grind 75 | Backtracking and prefix trees |
| 67 | [K Closest Points to Origin](https://leetcode.com/problems/k-closest-points-to-origin) | Grind 75 | Heaps and pointer-based design |
| 68 | [Add Two Numbers](https://leetcode.com/problems/add-two-numbers) | Bloomberg | Heaps and pointer-based design |
| 69 | [Reverse Linked List II](https://leetcode.com/problems/reverse-linked-list-ii) | Bloomberg | Heaps and pointer-based design |
| 70 | [Reorder List](https://leetcode.com/problems/reorder-list) | Bloomberg | Heaps and pointer-based design |
| 71 | [LRU Cache](https://leetcode.com/problems/lru-cache) | Grind 75 + Bloomberg | Heaps and pointer-based design |
| 72 | [Insert Delete GetRandom O(1)](https://leetcode.com/problems/insert-delete-getrandom-o1) | Bloomberg | Heaps and pointer-based design |
| 73 | [Number of Provinces](https://leetcode.com/problems/number-of-provinces) | Bloomberg | Connectivity and graph dependencies |
| 74 | [Accounts Merge](https://leetcode.com/problems/accounts-merge) | Grind 75 | Connectivity and graph dependencies |
| 75 | [Evaluate Division](https://leetcode.com/problems/evaluate-division) | Bloomberg | Connectivity and graph dependencies |
| 76 | [Course Schedule](https://leetcode.com/problems/course-schedule) | Grind 75 | Connectivity and graph dependencies |
| 77 | [Minimum Height Trees](https://leetcode.com/problems/minimum-height-trees) | Grind 75 | Connectivity and graph dependencies |
| 78 | [Spiral Matrix](https://leetcode.com/problems/spiral-matrix) | Grind 75 + Bloomberg | Simulation and string implementation |
| 79 | [Rotate Image](https://leetcode.com/problems/rotate-image) | Bloomberg | Simulation and string implementation |
| 80 | [Rotate Array](https://leetcode.com/problems/rotate-array) | Bloomberg | Simulation and string implementation |
| 81 | [Find the Index of the First Occurrence in a String](https://leetcode.com/problems/find-the-index-of-the-first-occurrence-in-a-string) | Bloomberg | Simulation and string implementation |
| 82 | [Zigzag Conversion](https://leetcode.com/problems/zigzag-conversion) | Bloomberg | Simulation and string implementation |
| 83 | [String to Integer (atoi)](https://leetcode.com/problems/string-to-integer-atoi) | Grind 75 | Simulation and string implementation |
| 84 | [Add Binary](https://leetcode.com/problems/add-binary) | Grind 75 | Simulation and string implementation |
| 85 | [Multiply Strings](https://leetcode.com/problems/multiply-strings) | Bloomberg | Simulation and string implementation |
| 86 | [Smallest Divisible Digit Product I](https://leetcode.com/problems/smallest-divisible-digit-product-i) | Bloomberg | Simulation and string implementation |
| 87 | [Smallest Missing Integer Greater Than Sequential Prefix Sum](https://leetcode.com/problems/smallest-missing-integer-greater-than-sequential-prefix-sum) | Bloomberg | Simulation and string implementation |
| 88 | [Word Break](https://leetcode.com/problems/word-break) | Grind 75 | Dynamic programming state design |
| 89 | [Partition Equal Subset Sum](https://leetcode.com/problems/partition-equal-subset-sum) | Grind 75 | Dynamic programming state design |
| 90 | [Longest Palindromic Substring](https://leetcode.com/problems/longest-palindromic-substring) | Grind 75 + Bloomberg | Dynamic programming state design |
| 91 | [Maximum Profit in Job Scheduling](https://leetcode.com/problems/maximum-profit-in-job-scheduling) | Grind 75 | Dynamic programming state design |
| 92 | [Stone Game IV](https://leetcode.com/problems/stone-game-iv) | Bloomberg | Dynamic programming state design |
| 93 | [Best Time to Buy and Sell Stock II](https://leetcode.com/problems/best-time-to-buy-and-sell-stock-ii) | Bloomberg | Greedy decisions and stack applications |
| 94 | [Two City Scheduling](https://leetcode.com/problems/two-city-scheduling) | Bloomberg | Greedy decisions and stack applications |
| 95 | [Gas Station](https://leetcode.com/problems/gas-station) | Bloomberg | Greedy decisions and stack applications |
| 96 | [Task Scheduler](https://leetcode.com/problems/task-scheduler) | Grind 75 | Greedy decisions and stack applications |
| 97 | [Decode String](https://leetcode.com/problems/decode-string) | Bloomberg | Greedy decisions and stack applications |
| 98 | [Using a Robot to Print the Lexicographically Smallest String](https://leetcode.com/problems/using-a-robot-to-print-the-lexicographically-smallest-string) | Bloomberg | Greedy decisions and stack applications |
| 99 | [Minimum Window Substring](https://leetcode.com/problems/minimum-window-substring) | Grind 75 | Greedy decisions and stack applications |
| 100 | [Trapping Rain Water](https://leetcode.com/problems/trapping-rain-water) | Grind 75 + Bloomberg | Greedy decisions and stack applications |
| 101 | [Largest Rectangle in Histogram](https://leetcode.com/problems/largest-rectangle-in-histogram) | Grind 75 | Greedy decisions and stack applications |
| 102 | [Basic Calculator](https://leetcode.com/problems/basic-calculator) | Grind 75 | Greedy decisions and stack applications |
| 103 | [Construct Binary Tree from Preorder and Inorder Traversal](https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal) | Grind 75 | Advanced tree, graph, and heap combinations |
| 104 | [Serialize and Deserialize Binary Tree](https://leetcode.com/problems/serialize-and-deserialize-binary-tree) | Grind 75 | Advanced tree, graph, and heap combinations |
| 105 | [Merge k Sorted Lists](https://leetcode.com/problems/merge-k-sorted-lists) | Grind 75 | Advanced tree, graph, and heap combinations |
| 106 | [Find Median from Data Stream](https://leetcode.com/problems/find-median-from-data-stream) | Grind 75 | Advanced tree, graph, and heap combinations |
| 107 | [Word Ladder](https://leetcode.com/problems/word-ladder) | Grind 75 | Advanced tree, graph, and heap combinations |
| 108 | [Single Number](https://leetcode.com/problems/single-number) | Bloomberg | Arithmetic and advanced array invariants |
| 109 | [Divide Two Integers](https://leetcode.com/problems/divide-two-integers) | Bloomberg | Arithmetic and advanced array invariants |
| 110 | [Next Permutation](https://leetcode.com/problems/next-permutation) | Bloomberg | Arithmetic and advanced array invariants |
| 111 | [Split Array Largest Sum](https://leetcode.com/problems/split-array-largest-sum) | Bloomberg | Arithmetic and advanced array invariants |
| 112 | [Median of Two Sorted Arrays](https://leetcode.com/problems/median-of-two-sorted-arrays) | Bloomberg | Arithmetic and advanced array invariants |
| 113 | [Recyclable and Low Fat Products](https://leetcode.com/problems/recyclable-and-low-fat-products) | Bloomberg | SQL: filtering, distinct rows, then grouped retention |
| 114 | [Article Views I](https://leetcode.com/problems/article-views-i) | Bloomberg | SQL: filtering, distinct rows, then grouped retention |
| 115 | [Game Play Analysis IV](https://leetcode.com/problems/game-play-analysis-iv) | Bloomberg | SQL: filtering, distinct rows, then grouped retention |
