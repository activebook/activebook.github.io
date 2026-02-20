#!/bin/bash

# This script generates a repos.json file based on a configuration file.
# It requires `curl` and `jq` to be installed.

set -e

# Show help message
show_help() {
    cat << 'EOF'
Usage: ./generate-repos.sh [OPTIONS] [REPO-NAME]

Generate a repos.json file by fetching repository data from GitHub.

Options:
  -h, --help          Show this help message and exit
  --retry-failed      Retry previously failed repositories
  --list-failed       List all failed repositories

Arguments:
  REPO-NAME           Process only the specified repository

Examples:
  ./generate-repos.sh                     # Process all repositories
  ./generate-repos.sh gllm                # Process only 'gllm' repo
  ./generate-repos.sh --retry-failed      # Retry failed repositories
  ./generate-repos.sh --list-failed       # Show failed repos list

Files:
  repos-config.json   Input configuration file with repository names
  repos.json          Output file with fetched repository data
  failed-repos.txt    Tracks failed repositories for retry
  .env                Optional file containing GITHUB_TOKEN

Environment:
  GITHUB_TOKEN        GitHub Personal Access Token (required)

Dependencies:
  curl, jq

EOF
}

CONFIG_FILE="repos-config.json"
OUTPUT_FILE="repos.json"
FAILED_FILE="failed-repos.txt"
GITHUB_USERNAME="activebook"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Parse command line arguments
SPECIFIC_REPO=""
RETRY_FAILED=false
LIST_FAILED=false
SHOW_HELP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            SHOW_HELP=true
            shift
            ;;
        --retry-failed)
            RETRY_FAILED=true
            shift
            ;;
        --list-failed)
            LIST_FAILED=true
            shift
            ;;
        -*)
            echo -e "${RED}Error: Unknown option $1${NC}" >&2
            echo "Try '$0 --help' for more information." >&2
            exit 1
            ;;
        *)
            SPECIFIC_REPO="$1"
            shift
            ;;
    esac
done

# Show help if requested
if [ "$SHOW_HELP" = true ]; then
    show_help
    exit 0
fi

# 1. Check for dependencies
if ! command -v jq &> /dev/null;
then
    echo -e "${RED}Error: jq is not installed. Please install it (e.g., brew install jq)${NC}" >&2
    exit 1
fi

if ! command -v curl &> /dev/null;
then
    echo -e "${RED}Error: curl is not installed.${NC}" >&2
    exit 1
fi

# 2. Check for GitHub Token
# Source .env file if it exists
if [ -f ".env" ]; then
    echo -e "${YELLOW}Sourcing .env file...${NC}" >&2
    set -o allexport
    source ./.env
    set +o allexport
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: GITHUB_TOKEN environment variable is not set.${NC}" >&2
    echo "Please create a .env file or run as: GITHUB_TOKEN=your_token_here ./generate-repos.sh" >&2
    exit 1
fi

# Handle --list-failed option
if [ "$LIST_FAILED" = true ]; then
    if [ -f "$FAILED_FILE" ] && [ -s "$FAILED_FILE" ]; then
        echo -e "${YELLOW}Failed repos:${NC}"
        cat "$FAILED_FILE"
    else
        echo -e "${GREEN}No failed repos recorded.${NC}"
    fi
    exit 0
fi

# Build the list of repos to process
build_repo_list() {
    if [ "$RETRY_FAILED" = true ]; then
        if [ -f "$FAILED_FILE" ] && [ -s "$FAILED_FILE" ]; then
            echo -e "${YELLOW}Retrying failed repos...${NC}" >&2
            # Read failed repos and get their types from config
            while IFS= read -r failed_repo; do
                repo_type=$(jq -r --arg name "$failed_repo" '.featuredRepos[] | select(.name == $name) | .type' "$CONFIG_FILE" 2>/dev/null || echo "Unknown")
                echo -e "${failed_repo}\t${repo_type}"
            done < "$FAILED_FILE"
        else
            echo -e "${GREEN}No failed repos to retry.${NC}" >&2
            exit 0
        fi
    elif [ -n "$SPECIFIC_REPO" ]; then
        # Process only the specific repo
        repo_type=$(jq -r --arg name "$SPECIFIC_REPO" '.featuredRepos[] | select(.name == $name) | .type' "$CONFIG_FILE" 2>/dev/null)
        if [ -z "$repo_type" ]; then
            echo -e "${RED}Error: Repository '$SPECIFIC_REPO' not found in $CONFIG_FILE${NC}" >&2
            exit 1
        fi
        echo -e "${SPECIFIC_REPO}\t${repo_type}"
    else
        # Process all repos
        jq -r '.featuredRepos[] | "\(.name)\t\(.type)"' "$CONFIG_FILE"
    fi
}

process_repos() {
    local failed_repos=()
    local success_count=0
    local total_count=0

    # Clear failed repos file at start (unless retrying or specific repo)
    if [ "$RETRY_FAILED" = false ] && [ -z "$SPECIFIC_REPO" ]; then
        > "$FAILED_FILE"
    fi

    while IFS=$'\t' read -r repo_name repo_type; do
        ((total_count++))
        echo -e "${YELLOW} - Fetching $repo_name...${NC}" >&2
        api_url="https://api.github.com/repos/$GITHUB_USERNAME/$repo_name"

        # Fetch data and check HTTP status code
        temp_file="temp_$repo_name.json"
        http_code=$(curl -s -w "%{http_code}" -o "$temp_file" \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "User-Agent: activebook-portfolio-generator" \
            "$api_url")

        if [ "$http_code" -ne 200 ]; then
            echo -e "${RED}   ✗ Failed to fetch $repo_name (HTTP $http_code)${NC}" >&2
            failed_repos+=("$repo_name")
            echo "$repo_name" >> "$FAILED_FILE"
            rm -f "$temp_file"
            continue
        fi

        # Process the JSON body and add the type
        cat "$temp_file" | jq -c --arg type "$repo_type" '{name, description, html_url, stargazers_count, forks_count, language, type: $type}'
        rm -f "$temp_file"
        
        ((success_count++))
        echo -e "${GREEN}   ✓ Successfully fetched $repo_name${NC}" >&2
    done < <(build_repo_list)

    # Summary
    echo "" >&2
    echo -e "${YELLOW}========================================${NC}" >&2
    echo -e "${GREEN}Successfully fetched: $success_count/$total_count${NC}" >&2
    
    if [ ${#failed_repos[@]} -gt 0 ]; then
        echo -e "${RED}Failed repos: ${failed_repos[*]}${NC}" >&2
        echo -e "${YELLOW}Run './generate-repos.sh --retry-failed' to retry failed repos${NC}" >&2
    else
        # Clear failed file if all succeeded
        > "$FAILED_FILE"
    fi
    echo -e "${YELLOW}========================================${NC}" >&2
}

# 4. Decide write mode based on operation type
INCREMENTAL_MODE=false
if [ -n "$SPECIFIC_REPO" ] || [ "$RETRY_FAILED" = true ]; then
    INCREMENTAL_MODE=true
fi

# 5. Read existing repos.json if in incremental mode or file exists
if [ "$INCREMENTAL_MODE" = true ] && [ -f "$OUTPUT_FILE" ]; then
    echo -e "${YELLOW}Reading existing $OUTPUT_FILE for merge...${NC}" >&2
    EXISTING_JSON=$(cat "$OUTPUT_FILE")
else
    EXISTING_JSON="[]"
fi

# 6. Fetch data and merge into existing data
if [ -n "$SPECIFIC_REPO" ]; then
    echo -e "${YELLOW}Fetching specific repository: $SPECIFIC_REPO${NC}" >&2
elif [ "$RETRY_FAILED" = true ]; then
    echo -e "${YELLOW}Retrying failed repositories...${NC}" >&2
else
    echo -e "${YELLOW}Fetching all repository data...${NC}" >&2
fi

# Process repos and merge with existing data
merge_and_write() {
    local new_repo_json="$1"
    local repo_name=$(echo "$new_repo_json" | jq -r '.name')
    
    # Remove existing repo with same name and add new one
    local merged=$(echo "$EXISTING_JSON" | jq --argjson new "$new_repo_json" --arg name "$repo_name" \
        'map(select(.name != $name)) + [$new]')
    EXISTING_JSON="$merged"
    
    # Write incrementally after each successful fetch
    echo "$merged" | jq '.' > "$OUTPUT_FILE"
}

process_repos() {
    local failed_repos=()
    local success_count=0
    local total_count=0

    # Clear failed repos file at start (unless retrying or specific repo)
    if [ "$RETRY_FAILED" = false ] && [ -z "$SPECIFIC_REPO" ]; then
        > "$FAILED_FILE"
    fi

    while IFS=$'\t' read -r repo_name repo_type; do
        ((total_count++))
        echo -e "${YELLOW} - Fetching $repo_name...${NC}" >&2
        api_url="https://api.github.com/repos/$GITHUB_USERNAME/$repo_name"

        # Fetch data and check HTTP status code
        temp_file="temp_$repo_name.json"
        http_code=$(curl -s -w "%{http_code}" -o "$temp_file" \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "User-Agent: activebook-portfolio-generator" \
            "$api_url")

        if [ "$http_code" -ne 200 ]; then
            echo -e "${RED}   ✗ Failed to fetch $repo_name (HTTP $http_code)${NC}" >&2
            failed_repos+=("$repo_name")
            echo "$repo_name" >> "$FAILED_FILE"
            rm -f "$temp_file"
            continue
        fi

        # Process the JSON body and add the type
        local repo_json=$(cat "$temp_file" | jq -c --arg type "$repo_type" '{name, description, html_url, stargazers_count, forks_count, language, type: $type}')
        rm -f "$temp_file"
        
        # Merge into existing data and write immediately
        merge_and_write "$repo_json"
        
        ((success_count++))
        echo -e "${GREEN}   ✓ Successfully fetched and saved $repo_name${NC}" >&2
    done < <(build_repo_list)

    # Summary
    echo "" >&2
    echo -e "${YELLOW}========================================${NC}" >&2
    echo -e "${GREEN}Successfully fetched: $success_count/$total_count${NC}" >&2
    
    if [ ${#failed_repos[@]} -gt 0 ]; then
        echo -e "${RED}Failed repos: ${failed_repos[*]}${NC}" >&2
        echo -e "${YELLOW}Run './generate-repos.sh --retry-failed' to retry failed repos${NC}" >&2
    else
        # Clear failed file if all succeeded (only in full mode)
        if [ -z "$SPECIFIC_REPO" ] && [ "$RETRY_FAILED" = false ]; then
            > "$FAILED_FILE"
        fi
    fi
    echo -e "${YELLOW}========================================${NC}" >&2
}

process_repos

echo -e "${GREEN}Successfully updated $OUTPUT_FILE!${NC}"
