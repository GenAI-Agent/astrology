uv venv .venv

source .venv/bin/activate

uv pip install -r requirements.txt

uv pip freeze > requirements.txt
