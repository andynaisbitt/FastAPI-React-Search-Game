"""
Hint Generation Service
Generates difficulty-appropriate hints for game challenges
Ported from utils/game/generateHint.js
"""
import random
from typing import Dict, List
from app.utils.difficulty import get_difficulty, generate_hint_for_difficulty


def generate_hint(analyzed_url: Dict, hint_level: int, difficulty_id: str = 'medium') -> str:
    """
    Generate a hint based on URL analysis and hint level

    Args:
        analyzed_url: URL analysis data (domain, keywords, search_operators, etc.)
        hint_level: Current hint level (1-10)
        difficulty_id: Difficulty level (affects hint specificity)

    Returns:
        str: Generated hint text
    """
    # Validate input
    if not analyzed_url or not analyzed_url.get('domain'):
        return 'Try searching for the original URL using relevant keywords and search operators.'

    # Use difficulty-based hint generation
    return generate_hint_for_difficulty(difficulty_id, analyzed_url, hint_level)


def generate_domain_hint(domain: str) -> str:
    """Generate a hint about the domain"""
    hint_templates = [
        f'The original URL is from the domain "{domain}"',
        f'Focus your search on the domain "{domain}"',
        f'The website you\'re looking for is hosted on "{domain}"',
        f'Try searching within the "{domain}" domain',
    ]

    return random.choice(hint_templates)


def generate_related_keywords_hint(related_keywords: List[str]) -> str:
    """Generate a hint about related keywords"""
    if not related_keywords:
        return 'Try using relevant keywords in your search.'

    # Get 3 random keywords
    sample_size = min(3, len(related_keywords))
    random_keywords = random.sample(related_keywords, sample_size)
    keywords_string = ', '.join(random_keywords)

    hint_templates = [
        f'Try using the keywords "{keywords_string}" in your search',
        f'The search result is related to "{keywords_string}"',
        f'Consider including "{keywords_string}" in your search query',
        f'The original URL might contain the keywords "{keywords_string}"',
    ]

    return random.choice(hint_templates)


def generate_search_operators_hint(search_operators: List[str]) -> str:
    """Generate a hint about search operators"""
    if not search_operators:
        return 'Try using Google search operators to refine your search.'

    random_operator = random.choice(search_operators)

    hint_templates = [
        f'Use the search operator "{random_operator}" to narrow down your search',
        f'Try including "{random_operator}" in your search query',
        f'The "{random_operator}" search operator might help you find the original URL',
        f'Modify your search query with "{random_operator}" to get more specific results',
    ]

    return random.choice(hint_templates)


def generate_general_hint() -> str:
    """Generate a general hint"""
    hint_templates = [
        'Try different combinations of keywords in your search',
        'Consider using synonyms or related terms in your search query',
        'Look for search results that closely match the game question',
        'Pay attention to the website titles and descriptions in the search results',
        'Refine your search query based on the information provided in the search snippets',
    ]

    return random.choice(hint_templates)


def generate_progressive_hints(analyzed_url: Dict, max_hints: int = 5) -> List[str]:
    """
    Generate a progressive sequence of hints

    Args:
        analyzed_url: URL analysis data
        max_hints: Maximum number of hints to generate

    Returns:
        List of hint strings
    """
    hints = []
    domain = analyzed_url.get('domain', '')
    keywords = analyzed_url.get('keywords', [])
    search_operators = analyzed_url.get('search_operators', [])

    # Hint 1: General advice
    if max_hints >= 1:
        hints.append(generate_general_hint())

    # Hint 2: Keywords
    if max_hints >= 2 and keywords:
        hints.append(generate_related_keywords_hint(keywords))

    # Hint 3: Search operators
    if max_hints >= 3 and search_operators:
        hints.append(generate_search_operators_hint(search_operators))

    # Hint 4: Domain hint (partial)
    if max_hints >= 4 and domain:
        domain_prefix = domain.split('.')[0][:3] if '.' in domain else domain[:3]
        hints.append(f'The domain starts with: {domain_prefix}...')

    # Hint 5+: Full domain reveal
    if max_hints >= 5 and domain:
        hints.append(generate_domain_hint(domain))

    return hints
