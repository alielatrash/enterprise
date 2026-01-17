.PHONY: setup dev test clean lint run migrate

setup:
	python3 -m venv venv
	. venv/bin/activate && pip install --upgrade pip
	. venv/bin/activate && pip install -r requirements.txt
	cp .env.example .env || true
	@echo "✓ Setup complete. Edit .env with your API keys."

dev:
	. venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

run:
	. venv/bin/activate && uvicorn app.main:app --host 0.0.0.0 --port 8000

test:
	. venv/bin/activate && pytest tests/ -v --cov=app --cov-report=term-missing

migrate:
	. venv/bin/activate && python -m app.database

lint:
	. venv/bin/activate && ruff check app/ tests/
	. venv/bin/activate && black --check app/ tests/

format:
	. venv/bin/activate && black app/ tests/

clean:
	rm -rf venv __pycache__ .pytest_cache .coverage htmlcov
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete

docker-build:
	docker build -t mena-digest .

docker-run:
	docker run -p 8000:8000 --env-file .env mena-digest
