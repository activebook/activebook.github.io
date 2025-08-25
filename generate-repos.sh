#!/bin/bash

# This script generates a repos.json file based on a configuration file.
# It requires `curl` and `jq` to be installed.

set -e

CONFIG_FILE="repos-config.json"
OUTPUT_FILE="repos.json"
GITHUB_USERNAME="activebook"

# 1. Check for dependencies
if ! command -v jq &> /dev/null;
then
    echo "Error: jq is not installed. Please install it (e.g., brew install jq)" >&2
    exit 1
fi

if ! command -v curl &> /dev/null;
then
    echo "Error: curl is not installed." >&2
    exit 1
fi

# 2. Check for GitHub Token
# Source .env file if it exists
if [ -f ".env" ]; then
    echo "Sourcing .env file..."
    set -o allexport
    source ./.env
    set +o allexport
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set." >&2
    echo "Usage: GITHUB_TOKEN=your_token_here ./generate-repos.sh" >&2
    exit 1
fi

# 3. Read repo names from config file
repo_names=$(jq -r '.featuredRepos[]' "$CONFIG_FILE")

if [ -z "$repo_names" ]; then
    echo "No repositories found in $CONFIG_FILE" >&2
    exit 1
fi

# 4. Fetch data for each repo and build a JSON array
json_array="[]"
echo "Fetching repository data..."

for repo_name in $repo_names; do
    echo " - Fetching $repo_name..."
    api_url="https://api.github.com/repos/$GITHUB_USERNAME/$repo_name"

    # Fetch data and select/rename fields with jq
    repo_json=$(curl -s -H "Authorization: token $GITHUB_TOKEN" -H "User-Agent: activebook-portfolio-generator" "$api_url" | \
    jq -c '{name, description, html_url, stargazers_count, forks_count, language}')

    # Add the resulting JSON object to our array
    json_array=$(echo "$json_array" | jq --argjson item "$repo_json" '. + [$item]')
done

# 5. Write the final, pretty-printed JSON to the output file
echo "$json_array" | jq '.' > "$OUTPUT_FILE"

echo "\nSuccessfully generated $OUTPUT_FILE!"
