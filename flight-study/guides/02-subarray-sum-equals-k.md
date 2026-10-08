# 29. Subarray Sum Equals K

Given a list of integers `nums` and integer `k`, return the **number of nonempty contiguous subarrays** whose sum equals `k`. Count intervals, not distinct values. Negative numbers and zeros are allowed.

`[1,1,1], k=2 → 2`: intervals `[0:2]` and `[1:3]`. `[1,-1,0], k=0 → 3`: `[1,-1]`, `[0]`, and `[1,-1,0]`. `[0,0], k=0 → 3`.

Practice contract: arbitrary Python integers; input unchanged. Empty input returns 0 (a useful extension even if an online judge requires nonempty input).

## Understand the approaches

### 1. Running-sum enumeration
For each start, extend the end while accumulating the sum. Increment the count every time the sum is `k`. Do not stop after a match: zeros or later negative values can create more matches. **O(n²) time, O(1) space**. This is a simple oracle for small test cases.

### 2. Prefix array, then enumerate pairs
Define `prefix[0]=0` and `prefix[j+1]=prefix[j]+nums[j]`. The interval `[i,j)` sums to `prefix[j]-prefix[i]`. Check every `i<j`. **O(n²) time, O(n) space**. This is educational preparation for the hash-map optimization, not an improvement over running-sum enumeration.

### 3. Prefix sum + frequency map: the interview target
At current prefix sum `s`, an earlier prefix `p` produces a matching subarray exactly when `s-p=k`, or `p=s-k`. Store the **number** of times each earlier prefix occurred. Add `freq[s-k]` to the answer, then record `s`.

Initialize `freq={0:1}` for the empty prefix: this allows subarrays starting at index zero. Query **before** inserting the current prefix, otherwise `k=0` counts a zero-length interval. A set is insufficient because repeated prefix sums represent different start positions.

Invariant before each iteration: `freq` contains all prefix sums strictly before the new endpoint, with their exact multiplicities; `count` contains every matching interval ending before this endpoint. The lookup counts all and only new valid intervals; insertion prepares the next iteration. Each interval is counted once at its right endpoint.

**O(n) expected time, O(n) space**, assuming average constant-time dictionary operations. There can be n+1 distinct prefixes. Python integers safely handle the potentially quadratic number of matching intervals.

For `[1,-1,0]`, k=0: prefix 1 adds 0 matches; prefix 0 adds 1; the next prefix 0 adds 2; total 3.

**Why not sliding window?** With negatives, extending the window can decrease the sum and shrinking can increase it. The monotonic rule needed for a basic sum-based sliding window fails. For example `[3,-2]`, k=1 is a valid whole interval; discarding 3 just because it exceeds 1 loses the answer.

```python
def count_subarrays_brute(nums, k):
    count = 0
    for start in range(len(nums)):
        total = 0
        for end in range(start, len(nums)):
            total += nums[end]
            count += total == k
    return count

def count_subarrays_prefix_pairs(nums, k):
    prefix = [0]
    for x in nums:
        prefix.append(prefix[-1] + x)
    count = 0
    for start in range(len(nums)):
        for end in range(start + 1, len(nums) + 1):
            count += prefix[end] - prefix[start] == k
    return count

def count_subarrays_hash(nums, k):
    freq = {0: 1}
    prefix = count = 0
    for x in nums:
        prefix += x
        count += freq.get(prefix - k, 0)
        freq[prefix] = freq.get(prefix, 0) + 1
    return count

```

## Test every approach

Run these assertions after the definitions. Deterministic edge cases check the contract; seeded randomized cases compare optimized implementations against a simpler reference. Passing tests is evidence, not a proof; use the invariants above to explain correctness.

```python
import random
solutions = [count_subarrays_brute, count_subarrays_prefix_pairs, count_subarrays_hash]
cases = [([1,1,1],2,2), ([1,-1,0],0,3), ([0,0],0,3), ([],0,0),
         ([3,-2],1,1), ([5],5,1), ([5],0,0), ([-1,-1,1],-1,3)]
for fn in solutions:
    for nums,k,expected in cases:
        original = nums.copy()
        assert fn(nums,k) == expected, (fn.__name__, nums,k)
        assert nums == original
rng = random.Random(29)
for _ in range(400):
    nums = [rng.randint(-3,3) for _ in range(rng.randint(0,18))]
    k = rng.randint(-6,6)
    expected = count_subarrays_brute(nums,k)
    for fn in solutions[1:]:
        assert fn(nums,k) == expected, (fn.__name__, nums,k)
assert count_subarrays_hash([0]*1000,0) == 1000*1001//2
print("All subarray-count tests passed")

```

## Debug step by step

Predict each printed state before running. Change the sample and compare your prediction. To use the notebook debugger in JupyterLab, enable the bug icon, place a breakpoint inside a solution, then run a call in a new cell. Inspect the variables and step over one iteration at a time. The trace below also works without a graphical debugger.

```python
nums, k = [1,-1,0], 0
freq = {0:1}
prefix = count = 0
for i,x in enumerate(nums):
    prefix += x
    matches = freq.get(prefix-k,0)
    count += matches
    print(f"i={i}, prefix={prefix}, need={prefix-k}, earlier={freq}, added={matches}, count={count}")
    freq[prefix] = freq.get(prefix,0)+1

```

## Practice and interview follow-ups

**Must implement:** prefix sum + frequency map. **Must explain:** why the initial zero, multiplicities, and query-before-insert are necessary.

Follow-up: for the longest interval summing to k, store each prefix's earliest index instead of its frequency. For existence, a set may suffice. For listing all intervals, store lists of indices and account for output size.

Debug challenge: insert the current prefix before the lookup in a copied function; `[0], k=0` should expose the empty-interval bug. Then replace frequencies with a set and use `[0,0]` to expose lost multiplicity.

1. Restart the kernel, then Run All: every cell must work in order.
2. Hide the solution cells and implement your preferred approach in the scratch cell.
3. Explain the invariant aloud, then state time and auxiliary space complexity.
4. Re-run the test cases against your implementation.
5. Tomorrow, solve again without looking at the guide.

```python
# Scratch space: write your solution here.

```
