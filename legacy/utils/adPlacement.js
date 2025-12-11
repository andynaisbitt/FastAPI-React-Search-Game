// utils/adPlacement.js
/**
 * Dynamic Ad Placement System
 * Determines which ads to show based on challenge duration and user engagement
 */

const { getDifficulty } = require('./game/difficultyLevels');
const logger = require('./logger');

// Ad placement types
const AD_TYPES = {
  BANNER_BEFORE: 'banner_before',
  SIDEBAR_DURING: 'sidebar_during',
  INTERSTITIAL_AFTER: 'interstitial_after',
  SIDEBAR_TIP: 'sidebar_tip',
};

// Challenge duration categories
const DURATION_CATEGORIES = {
  SHORT: 'short',   // < 60 seconds
  MEDIUM: 'medium', // 60-180 seconds
  LONG: 'long',     // > 180 seconds
};

/**
 * Calculate ad strategy based on challenge configuration and user engagement
 * @param {Object} options - Configuration options
 * @param {string} options.difficulty - Challenge difficulty (simple, medium, hard, expert)
 * @param {number} options.timeLimitSeconds - Challenge time limit
 * @param {Object} options.userEngagement - User engagement data (optional)
 * @param {number} options.userEngagement.attempts - Number of attempts
 * @param {number} options.userEngagement.hintsUsed - Number of hints used
 * @param {number} options.userEngagement.idleTime - Seconds of idle time
 * @param {number} options.userEngagement.completionSpeed - Time taken to complete
 * @returns {Array<string>} Array of ad placement types to show
 */
function calculateAdStrategy(options) {
  const { difficulty, timeLimitSeconds, userEngagement = {} } = options;

  const placements = [];
  const duration = categorizeDuration(timeLimitSeconds);

  // Base strategy by duration
  switch (duration) {
    case DURATION_CATEGORIES.SHORT:
      // Short challenges: Interstitial only (high guarantee)
      placements.push(AD_TYPES.INTERSTITIAL_AFTER);
      break;

    case DURATION_CATEGORIES.MEDIUM:
      // Medium challenges: Sidebar + banner
      placements.push(AD_TYPES.SIDEBAR_DURING);
      placements.push(AD_TYPES.INTERSTITIAL_AFTER);
      break;

    case DURATION_CATEGORIES.LONG:
      // Long challenges: All placements
      placements.push(AD_TYPES.BANNER_BEFORE);
      placements.push(AD_TYPES.SIDEBAR_DURING);
      placements.push(AD_TYPES.INTERSTITIAL_AFTER);
      break;
  }

  // Engagement-based adjustments
  if (userEngagement.attempts > 3) {
    // User is struggling - show helpful tip + sidebar ad (if not already there)
    if (!placements.includes(AD_TYPES.SIDEBAR_TIP)) {
      placements.push(AD_TYPES.SIDEBAR_TIP);
    }
  }

  if (userEngagement.idleTime > 30) {
    // User is idle - add reminder banner (if not already there)
    if (!placements.includes(AD_TYPES.BANNER_BEFORE)) {
      placements.push(AD_TYPES.BANNER_BEFORE);
    }
  }

  if (userEngagement.completionSpeed && userEngagement.completionSpeed < 30) {
    // User solved quickly - skip interstitial (reward fast solvers)
    const index = placements.indexOf(AD_TYPES.INTERSTITIAL_AFTER);
    if (index > -1) {
      placements.splice(index, 1);
      logger.info('[AD PLACEMENT] Skipping interstitial for fast solver');
    }
  }

  logger.info(`[AD PLACEMENT] Strategy for ${difficulty} (${duration}): [${placements.join(', ')}]`);

  return placements;
}

/**
 * Categorize challenge duration
 * @param {number} timeLimitSeconds - Time limit in seconds
 * @returns {string} Duration category
 */
function categorizeDuration(timeLimitSeconds) {
  if (timeLimitSeconds < 60) return DURATION_CATEGORIES.SHORT;
  if (timeLimitSeconds <= 180) return DURATION_CATEGORIES.MEDIUM;
  return DURATION_CATEGORIES.LONG;
}

/**
 * Get AdSense code for a specific placement
 * @param {string} placementType - Ad placement type
 * @param {Object} options - Ad configuration
 * @param {string} options.adSenseClientId - Google AdSense client ID
 * @param {string} options.adSlot - Ad slot ID
 * @returns {string} HTML for ad placement
 */
function getAdCode(placementType, options = {}) {
  const { adSenseClientId, adSlot } = options;

  // If AdSense not configured, return placeholder
  if (!adSenseClientId) {
    return getAdPlaceholder(placementType);
  }

  // AdSense configuration by placement type
  const adConfigs = {
    [AD_TYPES.BANNER_BEFORE]: {
      format: 'horizontal',
      size: '728x90', // Leaderboard
      style: 'display:block',
    },
    [AD_TYPES.SIDEBAR_DURING]: {
      format: 'vertical',
      size: '160x600', // Wide Skyscraper
      style: 'display:inline-block;width:160px;height:600px',
    },
    [AD_TYPES.INTERSTITIAL_AFTER]: {
      format: 'rectangle',
      size: '336x280', // Large Rectangle
      style: 'display:inline-block;width:336px;height:280px',
    },
    [AD_TYPES.SIDEBAR_TIP]: {
      format: 'rectangle',
      size: '250x250', // Square
      style: 'display:inline-block;width:250px;height:250px',
    },
  };

  const config = adConfigs[placementType] || adConfigs[AD_TYPES.BANNER_BEFORE];

  return `
    <ins class="adsbygoogle"
         style="${config.style}"
         data-ad-client="${adSenseClientId}"
         data-ad-slot="${adSlot || 'auto'}"
         data-ad-format="${config.format}"></ins>
    <script>
      (adsbygoogle = window.adsbygoogle || []).push({});
    </script>
  `;
}

/**
 * Get ad placeholder (for development/testing)
 * @param {string} placementType - Ad placement type
 * @returns {string} HTML placeholder
 */
function getAdPlaceholder(placementType) {
  const placeholders = {
    [AD_TYPES.BANNER_BEFORE]: '<div class="ad-placeholder" style="width:728px;height:90px;background:#eee;text-align:center;line-height:90px;">Ad: Banner (728x90)</div>',
    [AD_TYPES.SIDEBAR_DURING]: '<div class="ad-placeholder" style="width:160px;height:600px;background:#eee;text-align:center;line-height:600px;">Ad: Sidebar (160x600)</div>',
    [AD_TYPES.INTERSTITIAL_AFTER]: '<div class="ad-placeholder" style="width:336px;height:280px;background:#eee;text-align:center;line-height:280px;">Ad: Interstitial (336x280)</div>',
    [AD_TYPES.SIDEBAR_TIP]: '<div class="ad-placeholder" style="width:250px;height:250px;background:#eee;text-align:center;line-height:250px;">Ad: Tip (250x250)</div>',
  };

  return placeholders[placementType] || '<div class="ad-placeholder">Ad Placeholder</div>';
}

/**
 * Get AdSense initialization script
 * @param {string} adSenseClientId - Google AdSense client ID
 * @returns {string} Script tag
 */
function getAdSenseScript(adSenseClientId) {
  if (!adSenseClientId) {
    return '<!-- AdSense not configured -->';
  }

  return `
    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adSenseClientId}"
         crossorigin="anonymous"></script>
  `;
}

/**
 * Calculate estimated revenue per ad placement
 * @param {string} placementType - Ad placement type
 * @param {string} difficulty - Challenge difficulty
 * @returns {number} Estimated revenue in USD
 */
function estimateRevenue(placementType, difficulty) {
  // Base CPM (Cost Per Mille - per 1000 impressions)
  const baseCPM = {
    [AD_TYPES.BANNER_BEFORE]: 2.0,
    [AD_TYPES.SIDEBAR_DURING]: 1.5,
    [AD_TYPES.INTERSTITIAL_AFTER]: 3.0, // Higher engagement
    [AD_TYPES.SIDEBAR_TIP]: 1.0,
  };

  // Difficulty multiplier (harder challenges = more engaged users = higher CPM)
  const difficultyMultiplier = {
    simple: 0.8,
    medium: 1.0,
    hard: 1.2,
    expert: 1.5,
  };

  const cpm = (baseCPM[placementType] || 2.0) * (difficultyMultiplier[difficulty] || 1.0);

  // Return revenue per impression
  return cpm / 1000;
}

/**
 * A/B test variant selector
 * @param {string} sessionId - Session ID for consistent variant
 * @returns {string} Variant (A, B, or C)
 */
function getAdVariant(sessionId) {
  // Use session ID to deterministically assign variant (consistent per session)
  const hash = sessionId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const variants = ['A', 'B', 'C'];

  return variants[hash % variants.length];
}

/**
 * Get ad strategy for A/B test variant
 * @param {string} variant - Variant (A, B, or C)
 * @param {Object} options - Challenge options
 * @returns {Array<string>} Ad placement strategy
 */
function getVariantStrategy(variant, options) {
  switch (variant) {
    case 'A':
      // Aggressive: All possible ad placements
      return [
        AD_TYPES.BANNER_BEFORE,
        AD_TYPES.SIDEBAR_DURING,
        AD_TYPES.INTERSTITIAL_AFTER,
      ];

    case 'B':
      // Balanced: Sidebar + interstitial
      return [AD_TYPES.SIDEBAR_DURING, AD_TYPES.INTERSTITIAL_AFTER];

    case 'C':
      // Minimal: Interstitial only
      return [AD_TYPES.INTERSTITIAL_AFTER];

    default:
      // Fallback to dynamic strategy
      return calculateAdStrategy(options);
  }
}

/**
 * Should show ad based on configuration
 * @param {Object} config - Ad configuration
 * @param {boolean} config.adsEnabled - Whether ads are enabled globally
 * @param {string} config.difficulty - Challenge difficulty
 * @param {boolean} config.isTestMode - Test mode (show placeholders)
 * @returns {boolean} True if ads should be shown
 */
function shouldShowAds(config) {
  const { adsEnabled, difficulty, isTestMode } = config;

  // Always show placeholders in test mode
  if (isTestMode) return true;

  // Check if ads are enabled globally
  if (!adsEnabled) return false;

  // Always show ads for all difficulties (maximize revenue)
  return true;
}

module.exports = {
  AD_TYPES,
  DURATION_CATEGORIES,
  calculateAdStrategy,
  categorizeDuration,
  getAdCode,
  getAdPlaceholder,
  getAdSenseScript,
  estimateRevenue,
  getAdVariant,
  getVariantStrategy,
  shouldShowAds,
};
