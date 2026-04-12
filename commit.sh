#!/bin/bash

# ═══════════════════════════════════════════════════════════════
#  LUFUS PROJECT - COMMIT HELPER
#  Cria commits organizados por feature
# ═══════════════════════════════════════════════════════════════

set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

print_header() {
    echo -e "${CYAN}${BOLD}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║         LUFUS PROJECT - COMMIT HELPER                   ║"
    echo "╚═══════════════════════════════════════════════════════════╝${RESET}"
    echo
}

print_status() {
    echo -e "${BOLD}Status atual:${RESET}"
    git status --short
    echo
}

# Features disponíveis para commit
FEATURES=(
    "database:Schema do banco com Drizzle"
    "domain:Entidades User e Wallet"
    "value-objects:Value Objects (ID, Email, Password, Points, Name)"
    "repositories:Interfaces de repositórios"
    "use-cases:Casos de uso (CreateUser, AddPoints, etc)"
    "infrastructure:Implementação Drizzle e criptografia"
    "cli:Sistema CLI admin"
    "client:CLI de cliente com login"
    "session:Gerenciamento de sessões"
    "auth:Use cases de autenticação (Login, Logout)"
    "security:Rate limiter e validações"
    "cqrs:CQRS Commands e Queries"
    "events:Domain Events e Event Store"
    "tests:Testes unitários"
    "docs:Documentação"
    "docker:Docker e docker-compose"
    "cleanup:Limpeza de arquivos"
)

commit_feature() {
    local prefix=$1
    local desc=$2
    
    echo -e "${BOLD}──────────────────────────────────────${RESET}"
    echo -e "${CYAN}Commit: ${GREEN}$prefix${RESET}"
    echo -e "${CYAN}Descrição: ${desc}${RESET}"
    echo
    
    # Verificar se há arquivos modificados
    if git status --short | grep -q .; then
        echo -e "${YELLOW}Arquivos para commit:${RESET}"
        git status --short
        echo
        
        read -p "Confirmar commit? [y/N] " -n 1 -r
        echo
        
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git add -A
            git commit -m "$prefix: $desc"
            echo -e "${GREEN}✓ Commit realizado!${RESET}"
            echo
            return 0
        else
            echo -e "${YELLOW}Commit cancelado${RESET}"
            return 1
        fi
    else
        echo -e "${YELLOW}Nenhum arquivo para commit${RESET}"
        return 2
    fi
}

# Mostrar ajuda
show_help() {
    echo -e "${BOLD}Uso:${RESET} $0 [opção]"
    echo
    echo "Opções:"
    echo -e "  ${GREEN}list${RESET}      - Listar features disponíveis"
    echo -e "  ${GREEN}status${RESET}    - Ver status do git"
    echo -e "  ${GREEN}commit${RESET}    - Fazer commits interativamente"
    echo -e "  ${GREEN}all${RESET}       - Commitar tudo de uma vez"
    echo -e "  ${GREEN}log${RESET}       - Ver histórico de commits"
    echo -e "  ${GREEN}undo${RESET}      - Desfazer último commit"
    echo -e "  ${GREEN}help${RESET}      - Esta ajuda"
    echo
}

# Listar features
list_features() {
    echo -e "${BOLD}Features disponíveis:${RESET}"
    echo
    local i=1
    for feature in "${FEATURES[@]}"; do
        prefix="${feature%%:*}"
        desc="${feature##*:}"
        printf "  ${GREEN}%2d.${RESET} ${CYAN}%-15s${RESET} %s\n" "$i" "$prefix" "$desc"
        ((i++))
    done
    echo
}

# Ver histórico
show_log() {
    echo -e "${BOLD}Histórico de commits:${RESET}"
    echo
    git log --oneline --graph --decorate -20
    echo
}

# Commit interativo
interactive_commit() {
    print_header
    print_status
    
    echo -e "${BOLD}Selecione a feature para commitar:${RESET}"
    echo
    
    local i=1
    for feature in "${FEATURES[@]}"; do
        prefix="${feature%%:*}"
        desc="${feature##*:}"
        echo -e "  ${GREEN}[$i]${RESET} ${CYAN}$prefix${RESET} - $desc"
        ((i++))
    done
    echo -e "  ${YELLOW}[0]${RESET} Cancelar"
    echo
    
    read -p "Escolha: " choice
    
    if [ "$choice" == "0" ] || [ -z "$choice" ]; then
        echo -e "${YELLOW}Cancelado${RESET}"
        return
    fi
    
    if [ "$choice" -ge 1 ] && [ "$choice" -le ${#FEATURES[@]} ]; then
        feature="${FEATURES[$((choice-1))]}"
        prefix="${feature%%:*}"
        desc="${feature##*:}"
        commit_feature "$prefix" "$desc"
    else
        echo -e "${RED}Opção inválida${RESET}"
    fi
}

# Commitar tudo
commit_all() {
    print_header
    print_status
    
    read -p "Commitar TODOS os arquivos? [y/N] " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Mensagem do commit: " message
        if [ -n "$message" ]; then
            git add -A
            git commit -m "$message"
            echo -e "${GREEN}✓ Commit realizado!${RESET}"
        else
            echo -e "${RED}Mensagem vazia${RESET}"
        fi
    else
        echo -e "${YELLOW}Cancelado${RESET}"
    fi
}

# Desfazer commit
undo_commit() {
    echo -e "${YELLOW}Desfazendo último commit...${RESET}"
    echo -e "${YELLOW}Os arquivos voltam para staged.${RESET}"
    echo
    read -p "Continuar? [y/N] " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git reset --soft HEAD~1
        echo -e "${GREEN}✓ Commit desfeito!${RESET}"
    else
        echo -e "${YELLOW}Cancelado${RESET}"
    fi
}

# Main
print_header

case "${1:-}" in
    list)
        list_features
        ;;
    status)
        print_status
        ;;
    commit)
        interactive_commit
        ;;
    all)
        commit_all
        ;;
    log)
        show_log
        ;;
    undo)
        undo_commit
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${BOLD}Comandos disponíveis:${RESET}"
        echo -e "  ${GREEN}./commit.sh list${RESET}    - Listar features"
        echo -e "  ${GREEN}./commit.sh status${RESET}  - Ver status"
        echo -e "  ${GREEN}./commit.sh commit${RESET}  - Commit interativo"
        echo -e "  ${GREEN}./commit.sh all${RESET}     - Commitar tudo"
        echo -e "  ${GREEN}./commit.sh log${RESET}     - Ver histórico"
        echo -e "  ${GREEN}./commit.sh undo${RESET}    - Desfazer commit"
        echo -e "  ${GREEN}./commit.sh help${RESET}    - Esta ajuda"
        echo
        echo -e "Execute ${GREEN}./commit.sh commit${RESET} para começar."
        ;;
esac
