"""
Test My URLs endpoint to see actual error
"""
import sys
import traceback
from fastapi import Request
from app.core.database import SessionLocal
from app.api.v1.endpoints.urls import get_my_urls


class MockRequest:
    def __init__(self):
        self.client = type('obj', (object,), {'host': '127.0.0.1'})()


async def test_my_urls():
    db = SessionLocal()
    request = MockRequest()

    try:
        result = await get_my_urls(request, limit=5, db=db)
        print(f"Success! Got {len(result)} URLs")
        print(result)
    except Exception as e:
        print(f"Error: {e}")
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(test_my_urls())
