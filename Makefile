.PHONY: up down build run logs ps

up:
	docker compose up -d postgres
	docker compose run --rm --profile run app bun run drizzle-kit push

down:
	docker compose down

build:
	docker compose build

run:
	docker compose run --rm --profile run app

logs:
	docker compose logs -f

ps:
	docker compose ps
