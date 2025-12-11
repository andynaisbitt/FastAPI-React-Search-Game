"""
Roasting System - Insult players when they fail/timeout/suck
Makes the game way more fun and chaotic
"""
import random
from typing import List

# Pre-game roasts (shown before game starts)
PRE_GAME_ROASTS: List[str] = [
    "Googling isn't THAT hard... is it?",
    "My grandma could find this faster 👵",
    "Did you even read the question?",
    "Bruh. Use. Better. Keywords.",
    "Your search skills = 💩",
    "Let's see if you can actually Google properly",
    "This should take you 30 seconds. Emphasis on 'should'.",
    "Try not to embarrass yourself",
    "Even a boomer could solve this",
    "Google is literally helping you and you're still gonna fail",
]

# Timeout roasts (when timer runs out)
TIMEOUT_ROASTS: List[str] = [
    "⏰ Time's up! Better luck tomorrow.",
    "Too slow! Maybe next time actually try?",
    "Did you fall asleep or what?",
    "Grandma called. She finished 5 minutes ago.",
    "The timer expired. Unlike your brain cells, which died earlier.",
    "You had ONE job. And you STILL ran out of time.",
    "Tick tock. You lose. Clock.",
    "Maybe set a reminder next time? Oh wait, time already ran out.",
    "Congrats! You just wasted your own time 🎉",
    "Speed: 0/10. Accuracy: N/A. Existence: questionable.",
]

# Wrong answer roasts (when they submit wrong URL)
WRONG_ANSWER_ROASTS: List[str] = [
    "Wrong! Read the question again, genius.",
    "Nope. Try harder.",
    "That's... not even close lmao",
    "Wrong answer. Shocking.",
    "How did you even find that URL? That's impressively wrong.",
    "❌ WRONG. Did you even try?",
    "Not even close. Like, not at all.",
    "I've seen monkeys with better search skills",
    "That's the WRONG answer. Read. The. Question.",
    "Imagine being this confident AND this wrong",
    "You really thought that was it, huh?",
    "Delete your browser history. Start over. Try again.",
]

# Slow completion roasts (when they finish but took forever)
SLOW_COMPLETION_ROASTS: List[str] = [
    "You got it... eventually 🐌",
    "Correct! Only took you forever.",
    "Right answer! Shame about the speed.",
    "You found it! After checking literally everything else first.",
    "Congrats! You're technically correct. And VERY slow.",
    "Finally! I was about to send a search party.",
    "Correct, but my grandma is still faster",
    "You win! Gold medal for slowest completion 🥇",
]

# Fast completion praise (rare positive feedback)
FAST_COMPLETION_PRAISE: List[str] = [
    "Holy shit, you actually did it fast! 🔥",
    "Damn! Are you a professional Googler?",
    "Speed demon! Respect.",
    "OK OK, I'm impressed 👏",
    "Finally, someone who can use Google properly",
    "You made that look easy. Good job!",
    "Fast AND correct. Unicorn sighting 🦄",
]

# Hint spam roasts (when using too many hints)
HINT_SPAM_ROASTS: List[str] = [
    "Another hint? Really? Just Google it.",
    "You're burning through hints like they're free",
    "At this rate, I'll just give you the answer",
    "Hint #%d: Maybe try actually searching?",
    "Stop asking for hints and USE YOUR BRAIN",
    "Hints aren't a crutch. Oh wait, for you they are.",
    "Every hint costs you time AND pride",
]

# First hint roasts (when they ask for first hint)
FIRST_HINT_ROASTS: List[str] = [
    "Giving up already? Here's a hint...",
    "Can't figure it out yourself? Fine.",
    "Alright, I'll hold your hand...",
    "One hint coming right up (loser)",
    "Hint time! Because you can't Google properly.",
]

# Expert difficulty roasts (for expert mode specifically)
EXPERT_DIFFICULTY_ROASTS: List[str] = [
    "Expert mode? Bold choice for someone with your skills.",
    "This is gonna hurt. A lot.",
    "Expert difficulty: Where hope goes to die",
    "You chose EXPERT? Brave. Stupid, but brave.",
    "I admire your confidence. Not your judgment.",
    "Expert mode: Prepare to suffer",
]

# Leaderboard roasts (when score is low)
LOW_SCORE_ROASTS: List[str] = [
    "That score won't make the leaderboard 😬",
    "You scored %d points. The leaderboard is laughing.",
    "With that score, you're more like 'loserboard' material",
    "Bottom of the leaderboard is still technically ON it...",
    "You call that a score? I call that sad.",
]

# Abandonment roasts (when they leave mid-game)
ABANDONMENT_ROASTS: List[str] = [
    "Quitter! We all saw that.",
    "Gave up? Typical.",
    "You didn't even try. Pathetic.",
    "Abandoned the game. Just like your dreams.",
]


def get_random_roast(category: str) -> str:
    """
    Get a random roast from a specific category

    Args:
        category: Roast category (pre_game, timeout, wrong_answer, etc.)

    Returns:
        Random roast string
    """
    roast_maps = {
        'pre_game': PRE_GAME_ROASTS,
        'timeout': TIMEOUT_ROASTS,
        'wrong_answer': WRONG_ANSWER_ROASTS,
        'slow_completion': SLOW_COMPLETION_ROASTS,
        'fast_completion': FAST_COMPLETION_PRAISE,
        'hint_spam': HINT_SPAM_ROASTS,
        'first_hint': FIRST_HINT_ROASTS,
        'expert_difficulty': EXPERT_DIFFICULTY_ROASTS,
        'low_score': LOW_SCORE_ROASTS,
        'abandonment': ABANDONMENT_ROASTS,
    }

    roasts = roast_maps.get(category, PRE_GAME_ROASTS)
    return random.choice(roasts)


def get_completion_roast(completion_time: int, time_limit: int, score: int) -> str:
    """
    Get contextual roast based on completion performance

    Args:
        completion_time: Time taken to complete (seconds)
        time_limit: Total time allowed (seconds)
        score: Final score

    Returns:
        Appropriate roast or praise
    """
    time_percentage = (completion_time / time_limit) * 100

    # Fast completion (< 25% of time used)
    if time_percentage < 25:
        return get_random_roast('fast_completion')

    # Slow completion (> 75% of time used)
    elif time_percentage > 75:
        return get_random_roast('slow_completion')

    # Low score
    elif score < 20:
        return random.choice(LOW_SCORE_ROASTS) % score

    # Default success message
    else:
        return f"Correct! You scored {score} points."


def get_hint_roast(hint_level: int, max_hints: int) -> str:
    """
    Get roast based on hint usage

    Args:
        hint_level: Current hint number (1-indexed)
        max_hints: Maximum hints allowed

    Returns:
        Hint-specific roast
    """
    if hint_level == 1:
        return get_random_roast('first_hint')

    elif hint_level >= max_hints - 1:
        return f"Hint #{hint_level}. You're out of hints soon, genius."

    elif hint_level >= 3:
        return random.choice(HINT_SPAM_ROASTS).replace('%d', str(hint_level))

    else:
        return f"Hint #{hint_level}:"


def get_difficulty_intro_roast(difficulty: str) -> str:
    """
    Get difficulty-specific intro roast

    Args:
        difficulty: Difficulty level (simple, medium, hard, expert)

    Returns:
        Difficulty-appropriate roast
    """
    difficulty_roasts = {
        'simple': "Simple mode? Playing it safe, huh?",
        'medium': "Medium difficulty. Let's see if you're actually medium at searching.",
        'hard': "Hard mode! This should be entertaining...",
        'expert': get_random_roast('expert_difficulty'),
    }

    return difficulty_roasts.get(difficulty, get_random_roast('pre_game'))
