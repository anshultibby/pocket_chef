import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID

import pytest
from app.main import app
from app.models.pantry import Nutrition, PantryItem, PantryItemData
from app.services.auth import get_current_user
from fastapi.testclient import TestClient

# Mock user for testing
TEST_USER = {"id": str(uuid.uuid4()), "email": "test@example.com"}


# Mock authentication dependency
@pytest.fixture(autouse=True)
def mock_auth():
    app.dependency_overrides[get_current_user] = lambda: TEST_USER
    yield
    app.dependency_overrides.clear()  # Clean up after tests


client = TestClient(app)


# Mock pantry manager
@pytest.fixture
def mock_pantry_manager():
    with patch("app.routers.pantry.pantry_manager") as mock:
        manager = AsyncMock()
        mock.get_items = AsyncMock()  # Explicitly create the method
        mock.return_value = manager
        yield mock


def test_get_items(mock_pantry_manager):
    # Prepare mock data
    mock_items = [
        PantryItem(
            id=str(uuid.uuid4()),
            user_id=TEST_USER["id"],
            data=PantryItemData(
                name="Test Item",
                quantity=1.0,
                unit="unit",
                standard_name=None,
                category=None,
                notes=None,
                expiry_date=None,
                price=None,
            ),
            nutrition=Nutrition(
                standard_unit="serving",
                calories=100,
                protein=10,
                carbs=20,
                fat=5,
                fiber=0,
            ),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
    ]

    # Set up the mock to return the items
    mock_pantry_manager.get_items.return_value = mock_items

    # Make request
    response = client.get("/pantry/items")

    # Assert response
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["data"]["name"] == "Test Item"

    # Verify the mock was called correctly
    mock_pantry_manager.get_items.assert_called_once_with(user_id=UUID(TEST_USER["id"]))


def test_add_items(mock_pantry_manager):
    # Prepare test data
    test_item = {
        "data": {
            "name": "Test Item",
            "quantity": 1.0,
            "unit": "unit",
            "standard_name": None,
            "category": None,
            "notes": None,
            "expiry_date": None,
            "price": None,
        },
        "nutrition": {},
    }

    mock_pantry_manager.add_single_item = AsyncMock(
        return_value=PantryItem(
            id=str(uuid.uuid4()),
            user_id=TEST_USER["id"],
            data=PantryItemData(**test_item["data"]),
            nutrition=Nutrition(**test_item["nutrition"]),
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
    )

    # Make request
    response = client.post("/pantry/items", json=[test_item])

    # Assert response
    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["data"]["name"] == "Test Item"


def test_add_items_validation_error(mock_pantry_manager):
    # Test with invalid data
    invalid_item = {
        "data": {
            "name": "Test Item",
            "quantity": "invalid",  # Should be a number
            "unit": "unit",
        },
        "nutrition": {},
    }

    # Make request
    response = client.post("/pantry/items", json=[invalid_item])

    # Assert response
    assert response.status_code == 422


def test_delete_item(mock_pantry_manager):
    # Setup mock
    mock_pantry_manager.delete_item = AsyncMock(return_value=True)

    # Make request
    response = client.delete("/pantry/items/123")

    # Assert response
    assert response.status_code == 200
    mock_pantry_manager.delete_item.assert_called_once_with(
        item_id="123", user_id=UUID(TEST_USER["id"])
    )


def test_delete_item_not_found(mock_pantry_manager):
    # Setup mock to raise ValueError for item not found
    mock_pantry_manager.delete_item = AsyncMock(
        side_effect=ValueError("Item not found")
    )

    # Make request
    response = client.delete("/pantry/items/123")

    # Assert response
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"
