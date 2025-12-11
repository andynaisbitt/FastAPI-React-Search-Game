"""
Profanity filtering utility
Cleans user-generated content (nicknames, challenge text, hints)
"""
from better_profanity import profanity
from typing import Optional, List

# Initialize profanity filter
profanity.load_censor_words()

# Add custom words if needed (gaming/internet slang)
CUSTOM_BAD_WORDS = [
    # Add any additional words specific to your context
]

if CUSTOM_BAD_WORDS:
    profanity.add_censor_words(CUSTOM_BAD_WORDS)


def clean_text(text: Optional[str], censor_char: str = "*") -> Optional[str]:
    """
    Clean a string by replacing profanity with censor characters

    Args:
        text: The text to clean
        censor_char: Character to use for censoring (default: '*')

    Returns:
        Cleaned text with profanity replaced
    """
    if not text or not isinstance(text, str):
        return text

    try:
        return profanity.censor(text, censor_char)
    except Exception as e:
        print(f"Error filtering profanity: {e}")
        return text


def is_profane(text: Optional[str]) -> bool:
    """
    Check if text contains profanity

    Args:
        text: The text to check

    Returns:
        True if profanity is detected, False otherwise
    """
    if not text or not isinstance(text, str):
        return False

    try:
        return profanity.contains_profanity(text)
    except Exception as e:
        print(f"Error checking profanity: {e}")
        return False


def clean_list(text_list: Optional[List[str]], censor_char: str = "*") -> Optional[List[str]]:
    """
    Clean a list of strings by replacing profanity

    Args:
        text_list: List of strings to clean
        censor_char: Character to use for censoring (default: '*')

    Returns:
        List with cleaned strings
    """
    if not text_list or not isinstance(text_list, list):
        return text_list

    return [clean_text(item, censor_char) if isinstance(item, str) else item for item in text_list]


def sanitize_nickname(nickname: Optional[str]) -> str:
    """
    Sanitize a nickname by removing profanity and limiting length

    Args:
        nickname: The nickname to sanitize

    Returns:
        Sanitized nickname (defaults to 'Anonymous' if empty after cleaning)
    """
    if not nickname or not isinstance(nickname, str):
        return "Anonymous"

    # Clean profanity
    cleaned = clean_text(nickname.strip())

    # Limit length (max 50 characters)
    if len(cleaned) > 50:
        cleaned = cleaned[:50]

    # Return 'Anonymous' if empty after cleaning
    return cleaned if cleaned else "Anonymous"
