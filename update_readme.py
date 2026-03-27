import json
import os

def update_readme():
    with open('repos.json', 'r') as f:
        repos = json.load(f)

    with open('README.md', 'r') as f:
        lines = f.readlines()

    new_lines = []
    found_projects = False
    for line in lines:
        if line.startswith('## Projects description'):
            new_lines.append(line)
            new_lines.append('\n')
            found_projects = True
            for repo in repos:
                name = repo['name']
                url = repo['html_url']
                description = repo.get('description', 'No description provided.')
                # The user seems to use a specific format:
                # - name [name](https://activebook.github.io/name/)
                # description
                # Wait, the URL in README.md is activebook.github.io/name/ but html_url is github.com/activebook/name
                # Let's check the README.md again.
                
                # Re-reading README.md:
                # - gllm [gllm](https://activebook.github.io/gllm/)
                # gllm is a powerful CLI tool ...
                
                # I will use the format from the existing README.md
                new_lines.append(f"- {name} [{name}](https://activebook.github.io/{name}/)\n")
                new_lines.append(f"{description}\n\n")
            break
        else:
            new_lines.append(line)

    if not found_projects:
        print("Could not find '## Projects description' in README.md")
        return

    with open('README.md', 'w') as f:
        f.writelines(new_lines)

if __name__ == "__main__":
    update_readme()
