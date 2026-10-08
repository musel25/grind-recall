# 31. Daily Temperatures

Given daily integer temperatures, return a list where position i is the number of days until a **strictly warmer** future temperature. If none exists, return 0 for that position. Equal temperatures do not count.

`[73,74,75,71,69,72,76,73] → [1,1,4,2,1,1,0,0]`. `[70,70,71] → [2,1,0]`. `[90,80,70] → [0,0,0]`.

Practice contract: arbitrary integer temperatures, including negatives; empty list returns an empty list; input unchanged. A bounded-domain alternative below accepts only 30 through 100 inclusive and validates that assumption explicitly.

## Understand the approaches

### 1. Scan forward for each day
For day i, visit later days in order and stop at the first strictly warmer one. The first match is the nearest by construction. **O(n²) time, O(1) auxiliary space excluding output**. A decreasing input realizes the worst case.

### 2. Left-to-right monotonic stack: recommended
Store unresolved **indices**, so you can compute distances. Their temperatures are nonincreasing from bottom to top (equal values may remain). When today's temperature is greater than the top's, pop that earlier index and assign `today-earlier`. Repeat until the top is not cooler, then push today.

Why is today the first warmer day for each popped index? If an earlier warmer day existed, that index would already have been removed on that day. Remaining indices have no warmer day yet. Unresolved entries at the end keep zero.

The nested while loop is **O(n) total time**, not O(n²): each index is pushed once and popped at most once. Space is **O(n) auxiliary**, plus O(n) output. A decreasing sequence maximizes stack size. Use `>` to pop: equal days remain unresolved.

### 3. Right-to-left monotonic stack
Keep future candidates. Remove candidates no warmer than today (`<=`), because today is closer and at least as warm for any still-earlier query. If a candidate remains, its index gives the nearest warmer day. Then push today. **O(n) time, O(n) auxiliary space**. Notice the inequality differs from the left-to-right version because the stack has a different meaning.

### 4. Bounded-temperature lookup
If temperatures are guaranteed to lie in 30..100, scan right to left and remember the nearest index for every temperature. Query all larger temperatures, take the nearest index, then update today's temperature. **O(nR) time, O(R) auxiliary space**, R=71 here. With this fixed domain it is linear, but it is less general and usually less elegant than the stack. It is an optional constraint-based alternative, not necessary to memorize.

```python
def daily_brute(temperatures):
    answer = [0]*len(temperatures)
    for i,t in enumerate(temperatures):
        for j in range(i+1,len(temperatures)):
            if temperatures[j] > t:
                answer[i] = j-i
                break
    return answer

def daily_stack(temperatures):
    answer = [0]*len(temperatures)
    pending = []
    for i,t in enumerate(temperatures):
        while pending and t > temperatures[pending[-1]]:
            earlier = pending.pop()
            answer[earlier] = i-earlier
        pending.append(i)
    return answer

def daily_reverse(temperatures):
    answer = [0]*len(temperatures)
    candidates = []
    for i in range(len(temperatures)-1,-1,-1):
        while candidates and temperatures[candidates[-1]] <= temperatures[i]:
            candidates.pop()
        if candidates: answer[i] = candidates[-1]-i
        candidates.append(i)
    return answer

def daily_bounded(temperatures):
    if any(t < 30 or t > 100 for t in temperatures):
        raise ValueError("bounded solution requires temperatures in 30..100")
    n = len(temperatures)
    nearest = [n]*101
    answer = [0]*n
    for i in range(n-1,-1,-1):
        warmer_index = min((nearest[t] for t in range(temperatures[i]+1,101)), default=n)
        if warmer_index < n: answer[i] = warmer_index-i
        nearest[temperatures[i]] = i
    return answer

```

## Test every approach

Run these assertions after the definitions. Deterministic edge cases check the contract; seeded randomized cases compare optimized implementations against a simpler reference. Passing tests is evidence, not a proof; use the invariants above to explain correctness.

```python
import random
solutions = [daily_brute,daily_stack,daily_reverse]
cases = [([73,74,75,71,69,72,76,73],[1,1,4,2,1,1,0,0]),
         ([70,70,71],[2,1,0]), ([90,80,70],[0,0,0]),
         ([30,40,50],[1,1,0]), ([70,70],[0,0]), ([],[]), ([100],[0]),
         ([-3,-2,-4],[1,0,0])]
for fn in solutions:
    for nums,expected in cases:
        original = nums.copy()
        assert fn(nums) == expected, (fn.__name__,nums)
        assert nums == original
rng = random.Random(31)
for _ in range(400):
    nums = [rng.randint(30,100) for _ in range(rng.randint(0,40))]
    expected = daily_brute(nums)
    for fn in [daily_stack,daily_reverse,daily_bounded]:
        assert fn(nums) == expected, (fn.__name__,nums)
for nums in [[29],[101]]:
    try: daily_bounded(nums)
    except ValueError: pass
    else: raise AssertionError("must reject out-of-domain input")
assert daily_stack(list(range(10000,0,-1))) == [0]*10000
print("All daily-temperature tests passed")

```

## Debug step by step

Predict each printed state before running. Change the sample and compare your prediction. To use the notebook debugger in JupyterLab, enable the bug icon, place a breakpoint inside a solution, then run a call in a new cell. Inspect the variables and step over one iteration at a time. The trace below also works without a graphical debugger.

```python
temperatures = [73,74,75,71,69,72,76,73]
pending = []
answer = [0]*len(temperatures)
for i,t in enumerate(temperatures):
    while pending and t > temperatures[pending[-1]]:
        earlier = pending.pop()
        answer[earlier] = i-earlier
        print(f"day {i} ({t}) resolves day {earlier}: wait {i-earlier}")
    pending.append(i)
    print("pending (index,temp):",[(j,temperatures[j]) for j in pending],"answer:",answer)

```

## Practice and interview follow-ups

**Must implement:** left-to-right stack. **Must explain:** why indices are stored, equal-temperature handling, and the push-once/pop-once complexity argument. **Useful alternative:** reverse scan.

Follow-up: recognize the broader next-greater-element pattern. A circular version needs a second pass, and a streaming version can emit resolutions as new temperatures arrive but cannot finalize all zeros until the stream ends.

Debug challenge: change `>` to `>=` in a copy of `daily_stack`; `[70,70]` should fail. In the reverse solution, change `<=` to `<` and use the same case.

1. Restart the kernel, then Run All: every cell must work in order.
2. Hide the solution cells and implement your preferred approach in the scratch cell.
3. Explain the invariant aloud, then state time and auxiliary space complexity.
4. Re-run the test cases against your implementation.
5. Tomorrow, solve again without looking at the guide.

```python
# Scratch space: write your solution here.

```
