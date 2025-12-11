"""
Short Code Generator
Generates unique short codes for URLs
"""
import random
import string
from sqlalchemy.orm import Session
from app.models.url import ShortURL


def generate_short_code(length: int = 6) -> str:
    """
    Generate a random short code

    Args:
        length: Length of the short code (default 6)

    Returns:
        str: Random alphanumeric short code
    """
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))


def generate_unique_short_code(db: Session, max_attempts: int = 10) -> str:
    """
    Generate a unique short code that doesn't exist in database

    Args:
        db: Database session
        max_attempts: Maximum attempts to generate unique code

    Returns:
        str: Unique short code

    Raises:
        Exception: If unable to generate unique code after max_attempts
    """
    for _ in range(max_attempts):
        code = generate_short_code()

        # Check if code already exists
        existing = db.query(ShortURL).filter(ShortURL.short_code == code).first()

        if not existing:
            return code

    # If we get here, we've failed to generate a unique code
    raise Exception(f"Failed to generate unique short code after {max_attempts} attempts")
