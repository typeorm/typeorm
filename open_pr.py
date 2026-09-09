import os
import urllib.request
import json

token = os.getenv('GITHUB_TOKEN')
if not token:
    print("No GITHUB_TOKEN found.")
    exit(1)

url = 'https://api.github.com/repos/typeorm/typeorm/pulls'
headers = {
    'Authorization': f'token {token}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Mozilla/5.0'
}
data = {
    'title': 'fix(postgres): prevent data loss by using ALTER COLUMN instead of drop/create',
    'body': 'Fixes #3357. This PR addresses the Qodo review findings by using `ALTER COLUMN` to ensure we do not drop columns (and data) when modifying enums/collations in Postgres and CockroachDB.',
    'head': 'parastejpal987-cmyk:fix/issue-3357',
    'base': 'master',
    'draft': True
}

try:
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers, method='POST')
    res = urllib.request.urlopen(req)
    response_data = json.loads(res.read())
    print(f"Success! PR Created: {response_data.get('html_url')}")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} - {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
