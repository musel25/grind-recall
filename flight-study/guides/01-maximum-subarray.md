# 28. Maximum Subarray

Given a **nonempty** list of integers `nums`, return the largest sum of a **nonempty contiguous** subarray. Return the sum, not the indices. Contiguous means you may not skip elements. A subsequence is a different problem.

Example: `[-2,1,-3,4,-1,2,1,-5,4] → 6`, from `[4,-1,2,1]`. `[-5,-2,-8] → -2`, not zero: an empty subarray is forbidden. `[5] → 5`.

Practice contract: arbitrary Python integers, at least one element, input unchanged. Empty input raises `ValueError`. Python integers avoid fixed-width overflow. The online judge may impose additional numeric bounds; none are needed to run this pack offline.

## Understand the approaches

### 1. Enumerate starts and ends: the baseline
For each start, extend the end one position at a time and keep a running sum. Every contiguous subarray has exactly one start/end pair, so taking the maximum checks every candidate. Do not repeatedly call `sum(nums[start:end+1])`: doing that makes the simple enumeration cubic. The running-sum version is **O(n²) time, O(1) auxiliary space**.

### 2. Dynamic programming → Kadane: the one to implement first
Let `ending[i]` be the best sum of a nonempty subarray ending **exactly at i**. Such a subarray either starts at `i`, or extends the best one ending at `i-1`. Therefore `ending[i] = max(nums[i], ending[i-1] + nums[i])`. The global answer is the maximum of all `ending` values. An array implementation makes the recurrence visible: **O(n) time, O(n) space**. Only the previous state is needed, so Kadane compresses it to **O(n) time, O(1) space**.

Initialize from the first element. Initializing the answer to zero silently permits an empty answer and fails on all-negative arrays. Update `best` after updating `ending`. The invariant is: after processing index i, `ending` is optimal among subarrays ending there, and `best` is optimal anywhere in the processed prefix.

Trace on `[-2,1,-3,4,-1,2,1]`: `ending` is `-2,1,-2,4,3,5,6`; `best` is `-2,1,1,4,4,5,6`. A negative prefix can only hurt any future extension, so starting fresh discards it.

### 3. Prefix minimum: another useful derivation
A subarray sum equals `prefix[end] - prefix[start]`. For each right endpoint, subtract the smallest **earlier** prefix sum. Include the empty prefix zero. Update the answer before adding the current prefix to the minimum, so the selected subarray stays nonempty. **O(n) time, O(1) space**. This connects directly to the next problem.

### 4. Divide and conquer: recognize and explain
Split the interval in half. An optimal subarray lies entirely left, entirely right, or crosses the middle. A crossing optimum is the largest suffix of the left half plus the largest prefix of the right half. Recursively solve the first two and scan for the third. **O(n log n) time, O(log n) recursion space**. Kadane is simpler and faster for one query; divide and conquer is worth recognizing when discussing range summaries or segment trees.

```python
def require_nonempty(nums):
    if not nums:
        raise ValueError("nums must be nonempty")

def max_subarray_brute(nums):
    require_nonempty(nums)
    best = nums[0]
    for start in range(len(nums)):
        total = 0
        for end in range(start, len(nums)):
            total += nums[end]
            best = max(best, total)
    return best

def max_subarray_dp(nums):
    require_nonempty(nums)
    ending = [nums[0]]
    for x in nums[1:]:
        ending.append(max(x, ending[-1] + x))
    return max(ending)

def max_subarray_kadane(nums):
    require_nonempty(nums)
    ending = best = nums[0]
    for i in range(1, len(nums)):
        x = nums[i]
        ending = max(x, ending + x)
        best = max(best, ending)
    return best

def max_subarray_prefix(nums):
    require_nonempty(nums)
    prefix = min_prefix = 0
    best = nums[0]
    for x in nums:
        prefix += x
        best = max(best, prefix - min_prefix)
        min_prefix = min(min_prefix, prefix)
    return best

def max_subarray_divide(nums):
    require_nonempty(nums)
    def solve(lo, hi):  # inclusive bounds; no list slicing
        if lo == hi:
            return nums[lo]
        mid = (lo + hi) // 2
        left_answer = solve(lo, mid)
        right_answer = solve(mid + 1, hi)
        total = 0
        suffix = nums[mid]
        for i in range(mid, lo - 1, -1):
            total += nums[i]
            suffix = max(suffix, total)
        total = 0
        prefix = nums[mid + 1]
        for i in range(mid + 1, hi + 1):
            total += nums[i]
            prefix = max(prefix, total)
        return max(left_answer, right_answer, suffix + prefix)
    return solve(0, len(nums) - 1)

```

## Test every approach

Run these assertions after the definitions. Deterministic edge cases check the contract; seeded randomized cases compare optimized implementations against a simpler reference. Passing tests is evidence, not a proof; use the invariants above to explain correctness.

```python
import random
solutions = [max_subarray_brute, max_subarray_dp, max_subarray_kadane,
             max_subarray_prefix, max_subarray_divide]
cases = [([-2,1,-3,4,-1,2,1,-5,4],6), ([-5,-2,-8],-2), ([5],5),
         ([0,0],0), ([1,2,3],6), ([5,-10,6],6), ([-1],-1)]
for fn in solutions:
    for nums, expected in cases:
        original = nums.copy()
        assert fn(nums) == expected, (fn.__name__, nums)
        assert nums == original
    try:
        fn([])
    except ValueError:
        pass
    else:
        raise AssertionError("empty input must fail")
rng = random.Random(28)
for _ in range(300):
    nums = [rng.randint(-9,9) for _ in range(rng.randint(1,15))]
    expected = max_subarray_brute(nums)
    for fn in solutions[1:]:
        assert fn(nums) == expected, (fn.__name__, nums, expected)
print("All maximum-subarray tests passed")

```

## Debug step by step

Predict each printed state before running. Change the sample and compare your prediction. To use the notebook debugger in JupyterLab, enable the bug icon, place a breakpoint inside a solution, then run a call in a new cell. Inspect the variables and step over one iteration at a time. The trace below also works without a graphical debugger.

```python
nums = [-2,1,-3,4,-1,2,1]
ending = best = nums[0]
print("i x ending best")
print(0, nums[0], ending, best)
for i in range(1, len(nums)):
    ending = max(nums[i], ending + nums[i])
    best = max(best, ending)
    print(i, nums[i], ending, best)

```

## Practice and interview follow-ups

**Must implement:** Kadane. **Must explain:** brute force and the DP recurrence. **Useful alternatives:** prefix minimum and divide and conquer.

To return indices, keep the tentative start; reset it when starting fresh beats extending. When `best` improves, record that start and the current end. Define a tie policy before coding. For a circular array, discuss ordinary maximum versus total sum minus minimum subarray, with an all-negative special case.

Debug challenge: set `best = 0` in a copied version, run `[-5,-2,-8]`, and explain exactly which problem constraint it violates.

1. Restart the kernel, then Run All: every cell must work in order.
2. Hide the solution cells and implement your preferred approach in the scratch cell.
3. Explain the invariant aloud, then state time and auxiliary space complexity.
4. Re-run the test cases against your implementation.
5. Tomorrow, solve again without looking at the guide.

```python
# Scratch space: write your solution here.

```
