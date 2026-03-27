#!/bin/bash

# This script generates a repos.json file based on a configuration file.
# It requires `curl` and `jq` to be installed.

set -e

CONFIG_FILE="repos-config.json"
OUTPUT_FILE="repos.json"
FAILED_FILE="failed-repos.txt"
GITHUB_USERNAME="activebook"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Check for dependencies
if ! command -v jq &> /dev/null; then
    echo -e "${RED}Error: jq is not installed.${NC}" >&2
    exit 1
fi

if ! command -v curl &> /dev/null; then
    echo -e "${RED}Error: curl is not installed.${NC}" >&2
    exit 1
fi

# 2. Check for GitHub Token
if [ -f ".env" ]; then
    set -o allexport
    source ./.env
    set +o allexport
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo -e "${RED}Error: GITHUB_TOKEN environment variable is not set.${NC}" >&2
    exit 1
fi

# 3. Initialize output
EXISTING_JSON="[]"
if [ -f "$OUTPUT_FILE" ]; then
    # Try to read existing JSON, fallback to [] if invalid
    EXISTING_JSON=$(cat "$OUTPUT_FILE" | jq '.' 2>/dev/null || echo "[]")
fi

echo -e "${YELLOW}Fetching repository data...${NC}"

# Clear failed repos file
> "$FAILED_FILE"

# 4. Process repos
# We read from config and fetch each one
while IFS=$'\t' read -r repo_name repo_type; do
    if [ -z "$repo_name" ]; then continue; fi

    echo -e "${YELLOW} - Fetching $repo_name...${NC}"
    api_url="https://api.github.com/repos/$GITHUB_USERNAME/$repo_name"

    temp_file="temp_$repo_name.json"
    http_code=$(curl -s -w "%{http_code}" -o "$temp_file" \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "User-Agent: activebook-portfolio-generator" \
        "$api_url")

    if [ "$http_code" -ne 200 ]; then
        echo -e "${RED}   ✗ Failed to fetch $repo_name (HTTP $http_code)${NC}" >&2
        echo "$repo_name" >> "$FAILED_FILE"
        rm -f "$temp_file"
        continue
    fi

    # Extract needed fields and add type
    repo_json=$(cat "$temp_file" | jq -c --arg type "$repo_type" \
        '{name, description, html_url, stargazers_count, forks_count, language, type: $type}')
    rm -f "$temp_file"

    # Merge into EXISTING_JSON
    # Remove old entry with same name if exists, then add new one
    EXISTING_JSON=$(echo "$EXISTING_JSON" | jq --argjson new "$repo_json" --arg name "$repo_name" \
        'map(select(.name != $name)) + [$new]')

    # Write to file after each success
    echo "$EXISTING_JSON" | jq '.' > "$OUTPUT_FILE"
    echo -e "${GREEN}   ✓ Successfully updated $repo_name${NC}"
done < <(jq -r '.featuredRepos[] | "\(.name)\t\(.type)"' "$CONFIG_FILE")

echo -e "${GREEN}Successfully updated $OUTPUT_FILE!${NC}"
