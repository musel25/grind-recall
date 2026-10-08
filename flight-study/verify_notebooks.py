"""Execute every notebook in a fresh kernel, validate it, and save its outputs."""
from pathlib import Path
import nbformat
from nbclient import NotebookClient

ROOT = Path(__file__).resolve().parent
paths = sorted((ROOT / 'notebooks').glob('*.ipynb'))
assert len(paths) == 5, f'Expected five notebooks, found {len(paths)}'
for path in paths:
    notebook = nbformat.read(path, as_version=4)
    nbformat.validate(notebook)
    NotebookClient(
        notebook, timeout=120, kernel_name='python3',
        resources={'metadata': {'path': str(ROOT)}},
        allow_errors=False,
    ).execute()
    nbformat.validate(notebook)
    nbformat.write(notebook, path)
    print(f'PASS {path.name}', flush=True)
print('All five notebooks executed successfully in fresh kernels.')
