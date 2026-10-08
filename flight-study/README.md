# Flight study: the five problems after House Robber

Offline Python interview practice following Grind Recall's learning order, positions 28–32. Each problem has a self-contained notebook and a matching Markdown guide. No account, API, network request, or dataset is needed by the exercises.

| Order | Problem | Start here | Read offline | Main technique |
| --- | --- | --- | --- | --- |
| 28 | Maximum Subarray | [Notebook](notebooks/01-maximum-subarray.ipynb) | [Guide](guides/01-maximum-subarray.md) | Kadane / dynamic programming |
| 29 | Subarray Sum Equals K | [Notebook](notebooks/02-subarray-sum-equals-k.ipynb) | [Guide](guides/02-subarray-sum-equals-k.md) | Prefix sums + frequency map |
| 30 | Min Stack | [Notebook](notebooks/03-min-stack.ipynb) | [Guide](guides/03-min-stack.md) | Stack with minimum metadata |
| 31 | Daily Temperatures | [Notebook](notebooks/04-daily-temperatures.ipynb) | [Guide](guides/04-daily-temperatures.md) | Monotonic stack |
| 32 | Binary Tree Level Order Traversal | [Notebook](notebooks/05-binary-tree-level-order.ipynb) | [Guide](guides/05-binary-tree-level-order.md) | Breadth-first search |

## Open on this laptop

The environment and dependencies were installed while preparing this pack. From a terminal:

```sh
cd /home/musel/Github/grind-recall/flight-study
uv run --offline --frozen jupyter lab notebooks
```

Open the local URL printed by Jupyter if the browser does not open automatically. Keep the terminal running. Select a notebook, choose the Python kernel, then **Restart Kernel and Run All Cells**. The saved outputs are also readable without running anything. This starts a local server and needs no internet.

If using VS Code, open this folder, open an `.ipynb`, and select `.venv/bin/python` as the kernel. Install any required editor notebook extensions before departure; JupyterLab is already included and is the verified path.

## On another laptop: do this before the flight

Install uv, copy or clone this repository, then:

```sh
cd grind-recall/flight-study
uv sync --frozen
uv run python verify_notebooks.py
uv run --offline --frozen jupyter lab notebooks
```

The first sync may need internet to download Python/dependencies. A `.venv` is local to the machine and is not committed or portable; prepare each laptop before going offline. Python 3.13 or newer is required by this environment.

## How to study

1. Read only the statement. Write down an example and edge cases.
2. Try a baseline for 10–15 minutes. Say why it is correct.
3. Read the explanation, implement the target solution from memory, and compare.
4. Run the test cell. Change inputs in the trace cell and predict the state changes.
5. In JupyterLab, enable the debugger (bug icon), put a breakpoint inside a solution, and call that function from a new cell. Use Step Over and the Variables pane. The printed traces are a second way to inspect the same logic.
6. Use the scratch cell for your implementation. To test it, replace a function in the local `solutions` list (or a class in `classes` for Min Stack) and rerun the test cell. For the tree notebook, add your function to `solutions` for fixed cases and add an assertion in the randomized loop.
7. Finish with the follow-up prompts and deliberately broken variants described in each guide.

There are 19 runnable implementations across the five notebooks. The guides distinguish the primary interview approach, baseline reasoning, useful alternatives, and optional advanced techniques. This is a focused set of standard approaches, not a claim that every possible variant is required or that interview frequency has been measured.

Each guide includes an original problem restatement, a precise practice contract, examples, correctness reasoning, complexity, common mistakes, debugging code, tests, and follow-ups. Numeric judge limits are not assumed unless explicitly needed (the optional bounded-temperature algorithm). The standard solutions work on the broader contracts stated here.

## Recheck everything

```sh
uv run --offline --frozen python verify_notebooks.py
```

This validates notebook structure, runs all five in separate fresh kernels, fails on any cell error/assertion, and saves successful outputs. Tests include fixed edge cases, seeded randomized comparisons against simpler implementations, a 2,000-node tree chain, repeated minima, and a long decreasing temperature sequence. Random tests supplement the explanations; they do not prove correctness.

Only Python's standard library is imported by the exercise cells. Jupyter tooling is a development dependency, locked in `uv.lock`. Markdown guides mirror the notebook source; update both when editing explanations or code.
