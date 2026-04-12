#!/bin/bash

# Lufus CLI - Wrapper for Docker
# Usage: ./cli.sh [command]

CMD=$1
shift

# Ensure postgres is running
ensure_postgres() {
    docker compose up -d postgres
    sleep 2
}

case "$CMD" in
    start)
        ensure_postgres
        docker compose run --rm app bunx drizzle-kit push
        ;;
    push)
        ensure_postgres
        docker compose run --rm app bunx drizzle-kit push
        ;;
    create-user)
        ensure_postgres
        docker compose run --rm app bun run src/cli.ts create-user "$@"
        ;;
    add-points)
        ensure_postgres
        docker compose run --rm app bun run src/cli.ts add-points "$@"
        ;;
    remove-points)
        ensure_postgres
        docker compose run --rm app bun run src/cli.ts remove-points "$@"
        ;;
    get-balance)
        ensure_postgres
        docker compose run --rm app bun run src/cli.ts get-balance "$@"
        ;;
    get-user)
        ensure_postgres
        docker compose run --rm app bun run src/cli.ts get-user "$@"
        ;;
    list-users)
        ensure_postgres
        docker compose run --rm app bun run src/cli.ts list-users
        ;;
    delete-user)
        ensure_postgres
        docker compose run --rm app bun run src/cli.ts delete-user "$@"
        ;;
    delete-all-users)
        ensure_postgres
        docker compose run --rm app bun run src/cli.ts delete-all-users
        ;;
    generate-key)
        docker compose run --rm app bun run src/cli.ts generate-key
        ;;
    logs)
        docker compose logs -f
        ;;
    stop)
        docker compose down
        ;;
    psql)
        docker exec -it lufus_postgres psql -h localhost -p 5432 -U lufus -d lufus
        ;;
    "")
        ensure_postgres
        docker compose run --rm -it app bun run src/cli.ts
        ;;
    *)
        echo "Lufus CLI"
        echo ""
        echo "Usage: ./cli.sh [command]"
        echo ""
        echo "Commands:"
        echo "  (empty)         - Modo interativo"
        echo "  start           - Iniciar postgres e aplicar schema"
        echo "  push            - Aplicar schema"
        echo "  create-user     - Criar usuário"
        echo "  list-users      - Listar usuários"
        echo "  add-points      - Adicionar pontos"
        echo "  remove-points   - Remover pontos"
        echo "  get-balance    - Ver saldo"
        echo "  get-user        - Ver usuário"
        echo "  delete-user     - Deletar usuário"
        echo "  delete-all-users - Deletar todos"
        echo "  generate-key    - Gerar nova API key"
        echo "  logs            - Ver logs"
        echo "  stop            - Parar containers"
        echo "  psql            - Acessar banco"
        echo ""
        echo "Exemplos:"
        echo "  ./cli.sh                           # Modo interativo"
        echo "  ./cli.sh create-user email@ex.com Password1@ 'Nome'"
        echo "  ./cli.sh add-points USER_ID 100"
        ;;
esac
