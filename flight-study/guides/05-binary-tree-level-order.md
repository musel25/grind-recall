# 32. Binary Tree Level Order Traversal

Given the root of a binary tree, return node values grouped by depth, from root level down, and left to right within each level. A node has a value, a left child, and a right child. Missing children are `None`; values can repeat.

Tree with root 3, left child 9, and right child 20 (whose children are 15 and 7) returns `[[3],[9,20],[15,7]]`. Empty tree returns `[]`. One node with value 1 returns `[[1]]`.

Practice contract: a finite acyclic binary tree with no shared child nodes. The input tree is not modified. The cells construct nodes explicitly, so there is no ambiguous array-to-tree encoding to learn first.

## Understand the approaches

### 1. Breadth-first search with a queue: recommended
Start with the root in a deque. At the beginning of each level, capture `level_size=len(queue)`. Remove exactly that many nodes, append their values to this level, and enqueue left then right children. Capturing the size **before** processing is essential: children appended during this loop belong to the next level.

Invariant at the start of each outer iteration: the queue contains exactly the next level's nodes in left-to-right order. Removing them preserves that order, and appending their children left first builds the next level in the same order. Every node is visited exactly once. **O(n) time, O(w) auxiliary queue space**, where w is maximum width, plus O(n) output. During a level transition the queue can contain parts of two adjacent levels, still O(w).

Use `collections.deque.popleft()`, not `list.pop(0)`: removing the front of a Python list shifts the remaining elements and can make traversal quadratic on wide trees.

### 2. Depth-first search with depth buckets
Visit a node with depth d; create a bucket if needed and append its value. Recurse left before right. Although visiting times differ from BFS, left-first traversal visits same-depth nodes in left-to-right order, and depth buckets produce the requested grouping. **O(n) time, O(h) recursion space**, plus O(n) output. A skewed tree can exceed Python's recursion limit, so iterative BFS is a safer default for unknown depth.

### 3. Iterative DFS
Store `(node,depth)` pairs on a stack. Push right **before** left, because the last pushed node is visited first. This removes recursion-depth limitations. **O(n) time, O(h) auxiliary stack space** for binary-tree DFS, plus O(n) output. A wide tree favors DFS memory; a deeply skewed tree favors BFS queue memory.

A slower alternative is to repeatedly traverse the tree for each requested depth. It can cost O(nh), which becomes O(n²) on a chain; you should recognize why a single traversal is preferable, rather than memorize that implementation.

```python
from collections import deque
from dataclasses import dataclass

@dataclass
class TreeNode:
    val: int
    left: "TreeNode | None" = None
    right: "TreeNode | None" = None

def level_order_bfs(root):
    if root is None: return []
    queue = deque([root])
    answer = []
    while queue:
        level_size = len(queue)
        level = []
        for _ in range(level_size):
            node = queue.popleft()
            level.append(node.val)
            if node.left is not None: queue.append(node.left)
            if node.right is not None: queue.append(node.right)
        answer.append(level)
    return answer

def level_order_recursive(root):
    answer = []
    def visit(node,depth):
        if node is None: return
        if depth == len(answer): answer.append([])
        answer[depth].append(node.val)
        visit(node.left,depth+1)
        visit(node.right,depth+1)
    visit(root,0)
    return answer

def level_order_iterative_dfs(root):
    if root is None: return []
    answer = []
    stack = [(root,0)]
    while stack:
        node,depth = stack.pop()
        if depth == len(answer): answer.append([])
        answer[depth].append(node.val)
        if node.right is not None: stack.append((node.right,depth+1))
        if node.left is not None: stack.append((node.left,depth+1))
    return answer

```

## Test every approach

Run these assertions after the definitions. Deterministic edge cases check the contract; seeded randomized cases compare optimized implementations against a simpler reference. Passing tests is evidence, not a proof; use the invariants above to explain correctness.

```python
import random
sample = TreeNode(3,TreeNode(9),TreeNode(20,TreeNode(15),TreeNode(7)))
sparse = TreeNode(1,TreeNode(2,None,TreeNode(4)),TreeNode(3,TreeNode(5),None))
cases = [(None,[]), (TreeNode(1),[[1]]), (sample,[[3],[9,20],[15,7]]),
         (sparse,[[1],[2,3],[4,5]]),
         (TreeNode(1,TreeNode(1),TreeNode(1)),[[1],[1,1]])]
solutions = [level_order_bfs,level_order_recursive,level_order_iterative_dfs]
def snapshot(node):
    if node is None: return None
    return (node.val,snapshot(node.left),snapshot(node.right))
for fn in solutions:
    for tree,expected in cases:
        before = snapshot(tree)
        assert fn(tree) == expected, fn.__name__
        assert snapshot(tree) == before
rng = random.Random(32)
def random_tree(depth=0):
    if depth == 7 or rng.random() < 0.3: return None
    return TreeNode(rng.randint(-5,5),random_tree(depth+1),random_tree(depth+1))
for _ in range(200):
    tree = random_tree()
    expected = level_order_bfs(tree)
    assert level_order_recursive(tree) == expected
    assert level_order_iterative_dfs(tree) == expected
# Deep-chain test deliberately excludes recursive DFS: recursion has a depth limit.
chain = None
for value in reversed(range(2000)): chain = TreeNode(value,None,chain)
expected = [[i] for i in range(2000)]
assert level_order_bfs(chain) == expected
assert level_order_iterative_dfs(chain) == expected
print("All level-order tests passed")

```

## Debug step by step

Predict each printed state before running. Change the sample and compare your prediction. To use the notebook debugger in JupyterLab, enable the bug icon, place a breakpoint inside a solution, then run a call in a new cell. Inspect the variables and step over one iteration at a time. The trace below also works without a graphical debugger.

```python
root = TreeNode(3,TreeNode(9),TreeNode(20,TreeNode(15),TreeNode(7)))
queue = deque([root])
depth = 0
while queue:
    level_size = len(queue)
    print("begin depth",depth,"queue:",[node.val for node in queue])
    for _ in range(level_size):
        node = queue.popleft()
        if node.left is not None: queue.append(node.left)
        if node.right is not None: queue.append(node.right)
        print("visit",node.val,"queue now:",[item.val for item in queue])
    depth += 1

```

## Practice and interview follow-ups

**Must implement:** deque BFS with a fixed level size. **Must explain:** ordering and queue memory. **Useful alternatives:** recursive and iterative DFS with depth buckets.

Follow-ups: zigzag traversal reverses alternate output levels; right-side view takes the last value of each BFS level; minimum depth stops at the first leaf encountered by BFS; level averages aggregate values per level.

Debug challenge: push left before right in iterative DFS and inspect the sample output. Then explain why processing `while queue` inside a single level would merge all levels into one.

1. Restart the kernel, then Run All: every cell must work in order.
2. Hide the solution cells and implement your preferred approach in the scratch cell.
3. Explain the invariant aloud, then state time and auxiliary space complexity.
4. Re-run the test cases against your implementation.
5. Tomorrow, solve again without looking at the guide.

```python
# Scratch space: write your solution here.

```
