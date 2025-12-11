"""
Challenge Difficulty System
Defines 4 difficulty tiers with different parameters
Ported from utils/game/difficultyLevels.js
"""
from typing import Dict, List, Optional
from dataclasses import dataclass


@dataclass
class DifficultyConfig:
    """Configuration for a difficulty level"""
    id: str
    name: str
    description: str
    color: str
    icon: str

    # Timing
    time_limit_seconds: int
    time_bonus: int  # Points per second remaining

    # Hints
    max_hints: int
    hint_penalty_seconds: int
    hints_enabled: bool

    # Scoring
    points_correct: int
    points_wrong: int
    points_timeout: int

    # Search
    auto_fill_search: bool
    show_search_operators: bool

    # Analytics
    target_completion_rate: float
    expected_average_time: int


# Difficulty Level Configurations
DIFFICULTY_LEVELS: Dict[str, DifficultyConfig] = {
    'simple': DifficultyConfig(
        id='simple',
        name='Simple',
        description='Easy challenge for beginners',
        color='#4CAF50',  # Green
        icon='😊',

        # Timing
        time_limit_seconds=60,
        time_bonus=5,

        # Hints
        max_hints=2,
        hint_penalty_seconds=10,
        hints_enabled=True,

        # Scoring
        points_correct=10,
        points_wrong=-2,
        points_timeout=-5,

        # Search
        auto_fill_search=True,
        show_search_operators=True,

        # Analytics
        target_completion_rate=0.9,
        expected_average_time=30,
    ),

    'medium': DifficultyConfig(
        id='medium',
        name='Medium',
        description='Requires Googling to find the answer',
        color='#FFC107',  # Yellow
        icon='🤔',

        # Timing
        time_limit_seconds=120,
        time_bonus=3,

        # Hints
        max_hints=3,
        hint_penalty_seconds=15,
        hints_enabled=True,

        # Scoring
        points_correct=20,
        points_wrong=-5,
        points_timeout=-10,

        # Search
        auto_fill_search=False,
        show_search_operators=True,

        # Analytics
        target_completion_rate=0.65,
        expected_average_time=75,
    ),

    'hard': DifficultyConfig(
        id='hard',
        name='Hard',
        description='Multi-step research required',
        color='#FF5722',  # Orange-Red
        icon='😰',

        # Timing
        time_limit_seconds=180,
        time_bonus=2,

        # Hints
        max_hints=5,
        hint_penalty_seconds=20,
        hints_enabled=True,

        # Scoring
        points_correct=50,
        points_wrong=-10,
        points_timeout=-20,

        # Search
        auto_fill_search=False,
        show_search_operators=False,

        # Analytics
        target_completion_rate=0.4,
        expected_average_time=135,
    ),

    'expert': DifficultyConfig(
        id='expert',
        name='Expert',
        description='Custom creator challenge - extremely difficult',
        color='#9C27B0',  # Purple
        icon='💀',

        # Timing
        time_limit_seconds=300,
        time_bonus=1,

        # Hints
        max_hints=10,  # Unlimited hints (but heavy penalty)
        hint_penalty_seconds=30,
        hints_enabled=True,

        # Scoring
        points_correct=100,
        points_wrong=-20,
        points_timeout=-50,

        # Search
        auto_fill_search=False,
        show_search_operators=False,

        # Analytics
        target_completion_rate=0.15,
        expected_average_time=240,
    ),
}


def get_difficulty(difficulty_id: str) -> DifficultyConfig:
    """
    Get difficulty configuration by ID

    Args:
        difficulty_id: Difficulty level ID (simple, medium, hard, expert)

    Returns:
        DifficultyConfig: Difficulty configuration
    """
    difficulty = DIFFICULTY_LEVELS.get(difficulty_id.lower())

    if not difficulty:
        print(f"Invalid difficulty ID: {difficulty_id}, defaulting to medium")
        return DIFFICULTY_LEVELS['medium']

    return difficulty


def get_all_difficulties() -> List[DifficultyConfig]:
    """
    Get all difficulty levels (for UI selection)

    Returns:
        List of difficulty configurations
    """
    return list(DIFFICULTY_LEVELS.values())


def is_valid_difficulty(difficulty_id: str) -> bool:
    """Check if difficulty ID is valid"""
    return difficulty_id.lower() in DIFFICULTY_LEVELS


@dataclass
class ScoreBreakdown:
    """Score calculation breakdown"""
    base_points: int
    time_bonus: int
    hint_penalty: int
    total_score: int


def calculate_score(
    difficulty_id: str,
    time_remaining: int,
    hints_used: int,
    correct: bool
) -> ScoreBreakdown:
    """
    Calculate score based on difficulty and performance

    Args:
        difficulty_id: Difficulty level
        time_remaining: Seconds remaining
        hints_used: Number of hints used
        correct: Whether answer was correct

    Returns:
        ScoreBreakdown: Score calculation breakdown
    """
    difficulty = get_difficulty(difficulty_id)

    base_points = 0
    time_bonus = 0
    hint_penalty = 0

    if correct:
        # Base points for correct answer
        base_points = difficulty.points_correct

        # Time bonus (points per second remaining)
        time_bonus = int(time_remaining * difficulty.time_bonus)

        # Hint penalty (deduct points per hint used)
        points_per_hint = int(difficulty.points_correct / 5)  # 20% of base points per hint
        hint_penalty = -(hints_used * points_per_hint)
    else:
        # Penalty for wrong answer
        base_points = difficulty.points_wrong

    total_score = max(0, base_points + time_bonus + hint_penalty)  # Never go below 0

    return ScoreBreakdown(
        base_points=base_points,
        time_bonus=time_bonus,
        hint_penalty=hint_penalty,
        total_score=total_score
    )


def generate_hint_for_difficulty(
    difficulty_id: str,
    analyzed_url: Dict,
    hint_level: int
) -> str:
    """
    Generate difficulty-appropriate hints

    Args:
        difficulty_id: Difficulty level
        analyzed_url: URL analysis data (domain, keywords, path, category, url)
        hint_level: Current hint level (1-10)

    Returns:
        str: Hint text
    """
    difficulty = get_difficulty(difficulty_id)
    domain = analyzed_url.get('domain', '')
    keywords = analyzed_url.get('keywords', [])
    path = analyzed_url.get('path', '')
    category = analyzed_url.get('category', 'unknown')
    url = analyzed_url.get('url', '')

    # Simple difficulty: Give away more info
    if difficulty.id == 'simple':
        if hint_level == 1:
            return f"The website you're looking for is {domain}"
        elif hint_level == 2:
            return f"Try searching for: \"{' '.join(keywords)}\""
        else:
            return f"The exact URL is: {url}"

    # Medium difficulty: Balance hints
    if difficulty.id == 'medium':
        if hint_level == 1:
            domain_hint = domain.split('.')[0][:3] if '.' in domain else domain[:3]
            return f"The domain contains: {domain_hint}..."
        elif hint_level == 2:
            return f"Keywords to search: {', '.join(keywords[:2])}"
        elif hint_level == 3:
            tld = domain.split('.')[-1] if '.' in domain else ''
            return f"The top-level domain is: .{tld}"
        else:
            return f"Full domain: {domain}"

    # Hard difficulty: Vague hints
    if difficulty.id == 'hard':
        if hint_level == 1:
            return "Think about what type of website this could be..."
        elif hint_level == 2:
            return f"The website category might be: {category}"
        elif hint_level == 3:
            return f"The domain has {len(domain)} characters"
        elif hint_level == 4:
            return f"First letter of domain: {domain[0].upper()}" if domain else "No domain info"
        elif hint_level == 5:
            return f"The domain is: {domain}"
        else:
            return f"Path: {path}"

    # Expert difficulty: Cryptic hints
    if difficulty.id == 'expert':
        hints_expert = [
            f"The answer lies within {len(domain.split('.'))} parts...",
            f"It rhymes with... nothing. Google harder.",
            f"The domain starts with: {domain[0] if domain else '?'}",
            f"TLD: .{domain.split('.')[-1] if '.' in domain else '???'}",
            f"Vowels in domain: {sum(1 for c in domain if c in 'aeiou')}",
            f"Domain length: {len(domain)} characters",
            f"Contains numbers: {'Yes' if any(c.isdigit() for c in domain) else 'No'}",
            f"First 3 letters: {domain[:3] if len(domain) >= 3 else domain}",
            f"Last 3 letters: {domain[-3:] if len(domain) >= 3 else domain}",
            f"The domain is: {domain}"
        ]

        # Return hint based on level (1-indexed, but list is 0-indexed)
        if hint_level <= len(hints_expert):
            return hints_expert[hint_level - 1]
        else:
            return f"The full URL is: {url}"

    return "No hint available"
