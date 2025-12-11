// utils/game/difficultyLevels.js
/**
 * Challenge Difficulty System
 * Defines 4 difficulty tiers with different parameters
 */

const DIFFICULTY_LEVELS = {
  SIMPLE: {
    id: 'simple',
    name: 'Simple',
    description: 'Easy challenge for beginners',
    color: '#4CAF50', // Green
    icon: '😊',

    // Timing
    timeLimitSeconds: 60,
    timeBonus: 5, // Points per second remaining

    // Hints
    maxHints: 2,
    hintPenaltySeconds: 10,
    hintsEnabled: true,

    // Scoring
    pointsCorrect: 10,
    pointsWrong: -2,
    pointsTimeout: -5,

    // Search
    autoFillSearch: true, // Pre-fill search with keywords
    showSearchOperators: true,

    // Analytics
    targetCompletionRate: 0.9, // 90% completion target
    expectedAverageTime: 30, // seconds
  },

  MEDIUM: {
    id: 'medium',
    name: 'Medium',
    description: 'Requires Googling to find the answer',
    color: '#FFC107', // Yellow
    icon: '🤔',

    // Timing
    timeLimitSeconds: 120,
    timeBonus: 3,

    // Hints
    maxHints: 3,
    hintPenaltySeconds: 15,
    hintsEnabled: true,

    // Scoring
    pointsCorrect: 20,
    pointsWrong: -5,
    pointsTimeout: -10,

    // Search
    autoFillSearch: false,
    showSearchOperators: true,

    // Analytics
    targetCompletionRate: 0.65, // 65% completion target
    expectedAverageTime: 75,
  },

  HARD: {
    id: 'hard',
    name: 'Hard',
    description: 'Multi-step research required',
    color: '#FF5722', // Orange-Red
    icon: '😰',

    // Timing
    timeLimitSeconds: 180,
    timeBonus: 2,

    // Hints
    maxHints: 5,
    hintPenaltySeconds: 20,
    hintsEnabled: true,

    // Scoring
    pointsCorrect: 50,
    pointsWrong: -10,
    pointsTimeout: -20,

    // Search
    autoFillSearch: false,
    showSearchOperators: false,

    // Analytics
    targetCompletionRate: 0.4, // 40% completion target
    expectedAverageTime: 135,
  },

  EXPERT: {
    id: 'expert',
    name: 'Expert',
    description: 'Custom creator challenge - extremely difficult',
    color: '#9C27B0', // Purple
    icon: '💀',

    // Timing
    timeLimitSeconds: 300,
    timeBonus: 1,

    // Hints
    maxHints: 10, // Unlimited hints (but heavy penalty)
    hintPenaltySeconds: 30,
    hintsEnabled: true,

    // Scoring
    pointsCorrect: 100,
    pointsWrong: -20,
    pointsTimeout: -50,

    // Search
    autoFillSearch: false,
    showSearchOperators: false,

    // Analytics
    targetCompletionRate: 0.15, // 15% completion target
    expectedAverageTime: 240,
  },
};

/**
 * Get difficulty configuration by ID
 * @param {string} difficultyId - Difficulty level ID (simple, medium, hard, expert)
 * @returns {Object} Difficulty configuration
 */
function getDifficulty(difficultyId) {
  const difficulty = Object.values(DIFFICULTY_LEVELS).find(
    (d) => d.id === difficultyId
  );

  if (!difficulty) {
    console.warn(`Invalid difficulty ID: ${difficultyId}, defaulting to MEDIUM`);
    return DIFFICULTY_LEVELS.MEDIUM;
  }

  return difficulty;
}

/**
 * Get all difficulty levels (for UI selection)
 * @returns {Array} Array of difficulty objects
 */
function getAllDifficulties() {
  return Object.values(DIFFICULTY_LEVELS);
}

/**
 * Calculate score based on difficulty and performance
 * @param {string} difficultyId - Difficulty level
 * @param {number} timeRemaining - Seconds remaining
 * @param {number} hintsUsed - Number of hints used
 * @param {boolean} correct - Whether answer was correct
 * @returns {Object} Score breakdown
 */
function calculateScore(difficultyId, timeRemaining, hintsUsed, correct) {
  const difficulty = getDifficulty(difficultyId);

  let score = 0;
  const breakdown = {
    basePoints: 0,
    timeBonus: 0,
    hintPenalty: 0,
    totalScore: 0,
  };

  if (correct) {
    // Base points for correct answer
    breakdown.basePoints = difficulty.pointsCorrect;
    score += breakdown.basePoints;

    // Time bonus (points per second remaining)
    breakdown.timeBonus = Math.floor(timeRemaining * difficulty.timeBonus);
    score += breakdown.timeBonus;

    // Hint penalty (deduct points per hint used)
    const pointsPerHint = Math.floor(difficulty.pointsCorrect / 5); // 20% of base points per hint
    breakdown.hintPenalty = -(hintsUsed * pointsPerHint);
    score += breakdown.hintPenalty;
  } else {
    // Penalty for wrong answer
    breakdown.basePoints = difficulty.pointsWrong;
    score += breakdown.basePoints;
  }

  breakdown.totalScore = Math.max(0, score); // Never go below 0

  return breakdown;
}

/**
 * Generate difficulty-appropriate hints
 * @param {string} difficultyId - Difficulty level
 * @param {Object} analyzedUrl - URL analysis data
 * @param {number} hintLevel - Current hint level (1-5+)
 * @returns {string} Hint text
 */
function generateHintForDifficulty(difficultyId, analyzedUrl, hintLevel) {
  const difficulty = getDifficulty(difficultyId);
  const { domain, keywords, path } = analyzedUrl;

  // Simple difficulty: Give away more info
  if (difficulty.id === 'simple') {
    switch (hintLevel) {
      case 1:
        return `The website you're looking for is ${domain}`;
      case 2:
        return `Try searching for: "${keywords.join(' ')}"`;
      default:
        return `The exact URL is: ${analyzedUrl.url}`;
    }
  }

  // Medium difficulty: Balance hints
  if (difficulty.id === 'medium') {
    switch (hintLevel) {
      case 1:
        return `The domain contains: ${domain.split('.')[0].substring(0, 3)}...`;
      case 2:
        return `Keywords to search: ${keywords.slice(0, 2).join(', ')}`;
      case 3:
        return `The top-level domain is: .${domain.split('.').pop()}`;
      default:
        return `Full domain: ${domain}`;
    }
  }

  // Hard difficulty: Vague hints
  if (difficulty.id === 'hard') {
    switch (hintLevel) {
      case 1:
        return 'Think about what type of website this could be...';
      case 2:
        return `The website category might be: ${analyzedUrl.category || 'unknown'}`;
      case 3:
        return `The domain has ${domain.length} characters`;
      case 4:
        return `First letter of domain: ${domain[0].toUpperCase()}`;
      case 5:
        return `The domain is: ${domain}`;
      default:
        return `Path: ${path}`;
    }
  }

  // Expert difficulty: Cryptic hints
  if (difficulty.id === 'expert') {
    switch (hintLevel) {
      case 1:
        return 'The answer lies within the question itself...';
      case 2:
        return 'Consider the context of the challenge.';
      case 3:
        return `The URL has ${analyzedUrl.url.length} characters total.`;
      case 4:
        return 'What would someone create a challenge about?';
      case 5:
        return `The domain ends with: ...${domain.slice(-10)}`;
      default:
        return `Getting desperate? The domain is: ${domain}`;
    }
  }

  return 'No more hints available!';
}

/**
 * Get difficulty-based timer configuration
 * @param {string} difficultyId - Difficulty level
 * @returns {Object} Timer configuration
 */
function getTimerConfig(difficultyId) {
  const difficulty = getDifficulty(difficultyId);

  return {
    totalTime: difficulty.timeLimitSeconds,
    warningThreshold: difficulty.timeLimitSeconds * 0.25, // 25% remaining
    criticalThreshold: difficulty.timeLimitSeconds * 0.1, // 10% remaining
    timeBonus: difficulty.timeBonus,
  };
}

/**
 * Get difficulty badge data for UI display
 * @param {string} difficultyId - Difficulty level
 * @returns {Object} Badge display data
 */
function getDifficultyBadge(difficultyId) {
  const difficulty = getDifficulty(difficultyId);

  return {
    name: difficulty.name,
    icon: difficulty.icon,
    color: difficulty.color,
    description: difficulty.description,
  };
}

/**
 * Validate if difficulty ID is valid
 * @param {string} difficultyId - Difficulty level to validate
 * @returns {boolean} True if valid
 */
function isValidDifficulty(difficultyId) {
  return Object.values(DIFFICULTY_LEVELS).some((d) => d.id === difficultyId);
}

/**
 * Get recommended difficulty based on URL complexity
 * @param {Object} analyzedUrl - URL analysis data
 * @returns {string} Recommended difficulty ID
 */
function recommendDifficulty(analyzedUrl) {
  const { domain, keywords, path } = analyzedUrl;

  // Simple: Well-known domains
  const popularDomains = ['google.com', 'youtube.com', 'facebook.com', 'twitter.com', 'github.com'];
  if (popularDomains.some((d) => domain.includes(d))) {
    return 'simple';
  }

  // Hard: Long complex URLs with many path segments
  const pathSegments = path.split('/').filter((s) => s.length > 0);
  if (pathSegments.length > 5 || keywords.length > 8) {
    return 'hard';
  }

  // Medium: Everything else (default)
  return 'medium';
}

module.exports = {
  DIFFICULTY_LEVELS,
  getDifficulty,
  getAllDifficulties,
  calculateScore,
  generateHintForDifficulty,
  getTimerConfig,
  getDifficultyBadge,
  isValidDifficulty,
  recommendDifficulty,
};
