"""
Test script for profanity filter
Run with: python backend/test_profanity_filter.py
"""
from app.utils.profanity_filter import (
    clean_text,
    is_profane,
    clean_list,
    sanitize_nickname
)

def test_profanity_filter():
    print("=" * 60)
    print("PROFANITY FILTER TEST")
    print("=" * 60)

    # Test 1: Clean text
    print("\n1. Testing clean_text():")
    test_cases = [
        "This is a normal message",
        "What the hell is this",
        "Damn this is cool",
        "You're an asshole",
        "Fuck this shit",
    ]

    for text in test_cases:
        cleaned = clean_text(text)
        profane = is_profane(text)
        status = "[PROFANE]" if profane else "[CLEAN]"
        print(f"  {status} | Original: '{text}'")
        print(f"          | Cleaned:  '{cleaned}'")
        print()

    # Test 2: Clean list
    print("\n2. Testing clean_list():")
    hints = [
        "Check the homepage",
        "Look for fucking documentation",
        "Search in the damn GitHub repo"
    ]
    cleaned_hints = clean_list(hints)
    print(f"  Original hints: {hints}")
    print(f"  Cleaned hints:  {cleaned_hints}")
    print()

    # Test 3: Sanitize nickname
    print("\n3. Testing sanitize_nickname():")
    nicknames = [
        "PlayerOne",
        "DamnGoodPlayer",
        "FuckingPro123",
        "Asshole_Gamer",
        "",
        None,
        "ThisIsAVeryLongNicknameWithMoreThan50CharactersJustToTestTheLimitFunctionality",
    ]

    for nick in nicknames:
        cleaned_nick = sanitize_nickname(nick)
        print(f"  Original: '{nick}' -> Cleaned: '{cleaned_nick}'")

    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_profanity_filter()
