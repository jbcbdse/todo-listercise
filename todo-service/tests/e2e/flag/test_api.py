from httpx import AsyncClient

from todo_listercise.flag.service import FlagKey


def _by_key(rows: list[dict[str, object]], key: str) -> dict[str, object]:
    return next(row for row in rows if row["key"] == key)


class TestFlags:
    async def test_lists_seeded_flags_disabled(self, client: AsyncClient) -> None:
        response = await client.get("/flags")
        assert response.status_code == 200
        rows: list[dict[str, object]] = response.json()
        assert {row["key"] for row in rows} == set(FlagKey)
        assert all(row["enabled"] is False for row in rows)

    async def test_can_enable_priorities(self, client: AsyncClient) -> None:
        enabled = await client.put(
            f"/flags/{FlagKey.PRIORITIES}",
            json={"enabled": True},
        )
        assert enabled.status_code == 200
        listed = await client.get("/flags")
        assert _by_key(listed.json(), FlagKey.PRIORITIES)["enabled"] is True

    async def test_unknown_key_is_404(self, client: AsyncClient) -> None:
        response = await client.put("/flags/nope", json={"enabled": True})
        assert response.status_code == 404
