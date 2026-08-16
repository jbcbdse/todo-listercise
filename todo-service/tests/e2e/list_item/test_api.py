from typing import Any, cast

from httpx import AsyncClient


async def _create(
    client: AsyncClient,
    *,
    title: str = "buy milk",
    **fields: object,
) -> dict[str, Any]:
    response = await client.post("/todos", json={"title": title, **fields})
    assert response.status_code == 201
    return cast("dict[str, Any]", response.json())


async def _enable_priorities(client: AsyncClient) -> None:
    response = await client.put("/flags/priorities", json={"enabled": True})
    assert response.status_code == 200
    assert response.json()["enabled"] is True


class TestTodos:
    async def test_create_returns_item(self, client: AsyncClient) -> None:
        body = await _create(client)
        assert body["title"] == "buy milk"
        assert "id" in body

    async def test_list_includes_created(self, client: AsyncClient) -> None:
        created = await _create(client)
        listed = await client.get("/todos")
        assert listed.status_code == 200
        assert [row["id"] for row in listed.json()] == [created["id"]]

    async def test_complete(self, client: AsyncClient) -> None:
        created = await _create(client)
        response = await client.patch(
            f"/todos/{created['id']}",
            json={"completed": True},
        )
        assert response.status_code == 200
        assert response.json()["completed"] is True

    async def test_filter_incomplete(self, client: AsyncClient) -> None:
        created = await _create(client)
        await _create(client, title="urgent")
        await client.patch(f"/todos/{created['id']}", json={"completed": True})
        filtered = await client.get("/todos", params={"status": "incomplete"})
        assert [row["title"] for row in filtered.json()] == ["urgent"]

    async def test_delete(self, client: AsyncClient) -> None:
        created = await _create(client)
        deleted = await client.delete(f"/todos/{created['id']}")
        assert deleted.status_code == 204
        listed = await client.get("/todos")
        assert listed.json() == []

    async def test_unknown_id_is_404(self, client: AsyncClient) -> None:
        response = await client.delete(
            "/todos/00000000-0000-0000-0000-000000000000",
        )
        assert response.status_code == 404


class TestPriorityFlag:
    async def test_create_ignores_priority_when_off(self, client: AsyncClient) -> None:
        body = await _create(client, priority=1)
        assert body["priority"] == 3

    async def test_create_uses_priority_when_on(self, client: AsyncClient) -> None:
        await _enable_priorities(client)
        body = await _create(client, title="urgent", priority=1)
        assert body["priority"] == 1

    async def test_update_applies_priority_when_on(self, client: AsyncClient) -> None:
        await _enable_priorities(client)
        created = await _create(client)
        patched = await client.patch(
            f"/todos/{created['id']}",
            json={"priority": 5},
        )
        assert patched.status_code == 200
        assert patched.json()["priority"] == 5

    async def test_update_keeps_priority_when_off(self, client: AsyncClient) -> None:
        await _enable_priorities(client)
        created = await _create(client, priority=1)
        await client.put("/flags/priorities", json={"enabled": False})
        ignored = await client.patch(
            f"/todos/{created['id']}",
            json={"priority": 5},
        )
        assert ignored.status_code == 200
        assert ignored.json()["priority"] == 1
