# 30. Min Stack

Implement a stack supporting `push(x)`, `pop()`, `top()`, and `get_min()`. `pop` removes the most recently pushed value; `top` reads it; `get_min` returns the smallest currently stored value. Target constant-time minimum lookup without scanning the stack.

Example: push -2, push 0, push -3; get_min → -3; pop; top → 0; get_min → -2.

Practice API: `pop()` returns the removed integer for easier testing (some judges expect no return value). Empty `pop`, `top`, and `get_min` raise `IndexError`. Integers may repeat or be negative. Judge naming is often `getMin`; rename or wrap `get_min` when submitting.

## Understand the approaches

### 1. Ordinary list + scan: baseline
Push/pop/top use the end of a list; `get_min` calls `min`. Minimum lookup is **O(n)**, so this does not satisfy the target. Space is **O(n)**. It makes a clear reference implementation.

### 2. Store (value, minimum_so_far) pairs: recommended
Each pushed entry stores the minimum among all entries at or below it. On push x, this is `min(x, old_min)`. Pop removes the pair and reveals the previous pair's correct minimum automatically. Inductively, every pair's saved minimum is correct for that stack prefix. All operations use **O(1) logical work**, with **O(n) space**. Python list pushes/pops are amortized O(1) because occasional resizing is possible.

### 3. Separate values and minima stacks
Push every value onto the values stack. Push onto the minima stack when `x <= current_min`, including ties. On pop, pop the minima stack if the removed value equals its top. The minima stack records successive record lows, preserving duplicates so popping one minimum does not erase another copy. **O(1) amortized operations, O(n) worst-case space**. It can store fewer minima than the pair approach on many inputs.

### 4. Encoded minimum: optional advanced alternative
When x is a new strict minimum below old minimum m, push `2*x-m` and set minimum to x. The encoded number is smaller than x, so at pop time `stored < current_min` identifies a marker. Recover the previous minimum using `2*current_min-stored`. Other values are stored normally. This uses one value stack plus one scalar: **O(n) total space**, O(1) extra bookkeeping, O(1) amortized operations. It does **not** make total storage O(1). Fixed-width arithmetic may overflow; Python's integers avoid that. Prefer the pair implementation unless asked to discuss this tradeoff.

Duplicate minimum example: push 2, push 1, push 1, pop. The minimum is still 1. This catches using `<` instead of `<=` in the separate-minima method.

```python
class ScanMinStack:
    def __init__(self): self.values = []
    def push(self,x): self.values.append(x)
    def pop(self): return self.values.pop()
    def top(self): return self.values[-1]
    def get_min(self):
        if not self.values: raise IndexError("empty stack")
        return min(self.values)

class PairMinStack:
    def __init__(self): self.entries = []
    def push(self,x):
        minimum = min(x,self.entries[-1][1]) if self.entries else x
        self.entries.append((x,minimum))
    def pop(self): return self.entries.pop()[0]
    def top(self): return self.entries[-1][0]
    def get_min(self): return self.entries[-1][1]

class TwoMinStack:
    def __init__(self):
        self.values = []
        self.minima = []
    def push(self,x):
        self.values.append(x)
        if not self.minima or x <= self.minima[-1]:
            self.minima.append(x)
    def pop(self):
        x = self.values.pop()
        if x == self.minima[-1]: self.minima.pop()
        return x
    def top(self): return self.values[-1]
    def get_min(self): return self.minima[-1]

class EncodedMinStack:
    def __init__(self):
        self.values = []
        self.minimum = None
    def push(self,x):
        if not self.values:
            self.values.append(x)
            self.minimum = x
        elif x < self.minimum:
            self.values.append(2*x-self.minimum)
            self.minimum = x
        else:
            self.values.append(x)
    def pop(self):
        stored = self.values.pop()
        if stored < self.minimum:
            result = self.minimum
            self.minimum = 2*self.minimum-stored
        else:
            result = stored
        if not self.values: self.minimum = None
        return result
    def top(self):
        stored = self.values[-1]
        return self.minimum if stored < self.minimum else stored
    def get_min(self):
        if not self.values: raise IndexError("empty stack")
        return self.minimum

```

## Test every approach

Run these assertions after the definitions. Deterministic edge cases check the contract; seeded randomized cases compare optimized implementations against a simpler reference. Passing tests is evidence, not a proof; use the invariants above to explain correctness.

```python
import random
classes = [ScanMinStack,PairMinStack,TwoMinStack,EncodedMinStack]
for cls in classes:
    stack = cls()
    for method in [stack.pop,stack.top,stack.get_min]:
        try: method()
        except IndexError: pass
        else: raise AssertionError("empty operation must fail")
    for x in [2,1,1]: stack.push(x)
    assert stack.pop() == 1
    assert stack.get_min() == 1
    assert stack.pop() == 1
    assert stack.get_min() == 2
    assert stack.pop() == 2
    stack.push(10**30)
    stack.push(-10**30)
    assert stack.pop() == -10**30
    assert stack.get_min() == 10**30
    assert stack.pop() == 10**30
    rng = random.Random(30)
    reference = []
    for _ in range(2000):
        if not reference or rng.random() < 0.6:
            x = rng.randint(-5,5)
            stack.push(x)
            reference.append(x)
        else:
            assert stack.pop() == reference.pop()
        if reference:
            assert stack.top() == reference[-1]
            assert stack.get_min() == min(reference)
    while reference: assert stack.pop() == reference.pop()
print("All min-stack tests passed")

```

## Debug step by step

Predict each printed state before running. Change the sample and compare your prediction. To use the notebook debugger in JupyterLab, enable the bug icon, place a breakpoint inside a solution, then run a call in a new cell. Inspect the variables and step over one iteration at a time. The trace below also works without a graphical debugger.

```python
stack = PairMinStack()
for x in [-2,0,-3,-3]:
    stack.push(x)
    print("push",x,"entries:",stack.entries,"minimum:",stack.get_min())
for _ in range(3):
    removed = stack.pop()
    print("pop",removed,"entries:",stack.entries,"minimum:",stack.get_min())

```

## Practice and interview follow-ups

**Must implement:** pairs or two stacks. **Must explain:** restoration after pop and duplicate minima. **Optional:** arithmetic encoding; be clear about overflow and total storage.

Follow-ups: adapt the same metadata idea to maximum lookup; explain why a minimum queue needs a different design (for example two aggregate stacks). If strict worst-case allocation behavior matters, distinguish the abstract stack model from Python's dynamically resized list.

Debug challenge: change `<=` to `<` in `TwoMinStack.push`. Test push 2, push 1, push 1, pop, get_min.

1. Restart the kernel, then Run All: every cell must work in order.
2. Hide the solution cells and implement your preferred approach in the scratch cell.
3. Explain the invariant aloud, then state time and auxiliary space complexity.
4. Re-run the test cases against your implementation.
5. Tomorrow, solve again without looking at the guide.

```python
# Scratch space: write your solution here.

```
