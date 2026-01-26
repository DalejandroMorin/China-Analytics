from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

year = 2010
resp = client.get(f"/api/china/datos/{year}")
print('status_code=', resp.status_code)
try:
    print('json=', resp.json())
except Exception as e:
    print('no json body:', e)
