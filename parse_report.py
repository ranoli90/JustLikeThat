import json

with open('ranoli90_JustLikeThat-analysis-report.json') as f:
    data = json.load(f)

antipatterns = data['results']['antipatterns']

from collections import Counter, defaultdict

symbols = [item['symbol'] for item in antipatterns]

counts = Counter(symbols)

with open('symbol_counts.txt', 'w') as f:
    f.write("Symbol counts:\n")
    for symbol, count in sorted(counts.items()):
        f.write(f"{symbol}: {count}\n")

# Group by actual file
file_issues = defaultdict(list)

for item in antipatterns:
    # The hash is the same, assuming
    hash_part = "1c5ceae585395ba2a1c1b36c4282735747323a62/"
    suffix = "/anti_patterns.json"
    actual_file = item['file_path'].replace(hash_part, "").replace(suffix, "")
    file_issues[actual_file].append(item)

with open('file_issue_counts.txt', 'w') as f:
    f.write("Files with issue counts:\n")
    for file, issues in sorted(file_issues.items()):
        f.write(f"{file}: {len(issues)} issues\n")

# Group autofix issues by file
autofix_issues = defaultdict(list)

for item in antipatterns:
    if item['symbol'].startswith('autofix/'):
        hash_part = "1c5ceae585395ba2a1c1b36c4282735747323a62/"
        suffix = "/anti_patterns.json"
        actual_file = item['file_path'].replace(hash_part, "").replace(suffix, "")
        autofix_issues[actual_file].append(item)

with open('autofix_file_issues.txt', 'w') as f:
    f.write("Files with autofix issue counts:\n")
    for file, issues in sorted(autofix_issues.items()):
        f.write(f"{file}: {len(issues)} issues\n")
