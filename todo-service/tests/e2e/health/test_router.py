from httpx import AsyncClient


class TestHealth:
    async def test_healthz(self, client: AsyncClient) -> None:
        response = await client.get("/healthz")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    async def test_readyz(self, client: AsyncClient) -> None:
        response = await client.get("/readyz")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
