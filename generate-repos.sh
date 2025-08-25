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
    echo "Sourcing .env file..." >&2
    set -o allexport
    source ./.env
    set +o allexport
fi

if [ -z "$GITHUB_TOKEN" ]; then
    echo "Error: GITHUB_TOKEN environment variable is not set." >&2
    echo "Please create a .env file or run as: GITHUB_TOKEN=your_token_here ./generate-repos.sh" >&2
    exit 1
fi

# 3. Process the repositories
# This function processes each repo and outputs a stream of JSON objects.
process_repos() {
  jq -r '.featuredRepos[] | "\(.name)\t\(.type)"' "$CONFIG_FILE" | while IFS=$'\t' read -r repo_name repo_type;
  do
    echo " - Fetching $repo_name..." >&2
    api_url="https://api.github.com/repos/$GITHUB_USERNAME/$repo_name"

    # Fetch data, add the type, and output one compact JSON object.
    curl -s -H "Authorization: token $GITHUB_TOKEN" -H "User-Agent: activebook-portfolio-generator" "$api_url" | \
    jq -c --arg type "$repo_type" '{name, description, html_url, stargazers_count, forks_count, language, type: $type}'
  done
}

# 4. Fetch data and write to file
echo "Fetching repository data..." >&2
# We call the function and pipe its output stream to jq, which slurps it into an array.
json_array=$(process_repos | jq -s '.')

# 5. Write the final, pretty-printed JSON to the output file
echo "$json_array" | jq '.' > "$OUTPUT_FILE"

echo "\nSuccessfully generated $OUTPUT_FILE!"