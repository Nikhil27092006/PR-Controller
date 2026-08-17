import requests

token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzg2ODk5MzAyfQ.b_KVFspUDmDjqGkNVkMVRxVWbV6p1OCc6Ra5p11mCGc'
headers = {'Authorization': f'Bearer {token}'}
r = requests.get('http://localhost:8000/auth/me', headers=headers)
print(f'Status: {r.status_code}')
print(f'Content-Type: {r.headers.get("content-type")}')
print(f'Body: {r.text[:500]}')