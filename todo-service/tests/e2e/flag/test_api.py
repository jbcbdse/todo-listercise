from httpx import AsyncClient


class TestFlags:
    async def test_lists_priorities_disabled(self, client: AsyncClient) -> None:
        response = await client.get("/flags")
        assert response.status_code == 200
        assert response.json()[0]["key"] == "priorities"
        assert response.json()[0]["enabled"] is False

    async def test_can_enable_priorities(self, client: AsyncClient) -> None:
        enabled = await client.put("/flags/priorities", json={"enabled": True})
        assert enabled.status_code == 200
        listed = await client.get("/flags")
        assert listed.json()[0]["enabled"] is True

    async def test_unknown_key_is_404(self, client: AsyncClient) -> None:
        response = await client.put("/flags/nope", json={"enabled": True})
        assert response.status_code == 404
