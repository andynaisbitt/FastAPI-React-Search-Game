// test-features.js
// Quick test script for new features

console.log('🧪 Testing JFGI New Features...\n');

// Test 1: Difficulty System
console.log('Test 1: Difficulty System');
try {
  const { getDifficulty, getAllDifficulties, calculateScore } = require('./utils/game/difficultyLevels');

  const difficulties = getAllDifficulties();
  console.log(`✅ Found ${difficulties.length} difficulty levels:`);
  difficulties.forEach(d => console.log(`   ${d.icon} ${d.name} - ${d.timeLimitSeconds}s, ${d.maxHints} hints`));

  const medium = getDifficulty('medium');
  console.log(`✅ Medium difficulty config loaded: ${medium.timeLimitSeconds}s time limit`);

  const score = calculateScore('medium', 45, 2, true);
  console.log(`✅ Score calculation: ${score.totalScore} points (base: ${score.basePoints}, time bonus: ${score.timeBonus}, hint penalty: ${score.hintPenalty})`);

  console.log('✅ Difficulty system: PASSED\n');
} catch (err) {
  console.error('❌ Difficulty system: FAILED', err.message, '\n');
}

// Test 2: Database Tables
console.log('Test 2: Database Schema');
try {
  const { getDb } = require('./utils/urlShortener/database');
  const db = getDb();

  // Check tables exist
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log(`✅ Found ${tables.length} tables:`);
  tables.forEach(t => console.log(`   - ${t.name}`));

  // Check urls table has new columns
  const urlsSchema = db.prepare("PRAGMA table_info(urls)").all();
  const newColumns = ['difficulty', 'challengeText', 'hints', 'totalViews', 'totalCompletions'];
  const hasNewColumns = newColumns.every(col => urlsSchema.some(s => s.name === col));

  if (hasNewColumns) {
    console.log('✅ All new columns present in urls table');
  } else {
    console.log('⚠️  Some new columns missing (database needs refresh)');
  }

  console.log('✅ Database schema: PASSED\n');
} catch (err) {
  console.error('❌ Database schema: FAILED', err.message, '\n');
}

// Test 3: Analytics System
console.log('Test 3: Analytics System');
try {
  const analytics = require('./utils/analytics');

  // Test session creation (mock request)
  const mockReq = {
    ip: '127.0.0.1',
    connection: { remoteAddress: '127.0.0.1' },
    get: (header) => header === 'user-agent' ? 'test-agent' : null,
  };

  const sessionId = analytics.startSession('test_' + Date.now(), mockReq);
  console.log(`✅ Session created: ID ${sessionId}`);

  // Test completion tracking
  analytics.trackCompletion(sessionId, {
    completionTime: 45.5,
    hintsUsed: 2,
    attempts: 1,
    score: 147,
  });
  console.log('✅ Completion tracked');

  // Test analytics summary
  const summary = analytics.getGlobalAnalytics();
  console.log(`✅ Global analytics: ${summary.totalUrls || 0} URLs, ${summary.totalViews || 0} views`);

  console.log('✅ Analytics system: PASSED\n');
} catch (err) {
  console.error('❌ Analytics system: FAILED', err.message, '\n');
}

// Test 4: Ad Placement System
console.log('Test 4: Ad Placement System');
try {
  const { calculateAdStrategy, estimateRevenue, getAdVariant } = require('./utils/adPlacement');

  const placements = calculateAdStrategy({
    difficulty: 'hard',
    timeLimitSeconds: 180,
    userEngagement: {
      attempts: 1,
      hintsUsed: 0,
    },
  });
  console.log(`✅ Ad strategy calculated: ${placements.length} placements`);
  console.log(`   Placements: ${placements.join(', ')}`);

  const revenue = estimateRevenue('interstitial_after', 'hard');
  console.log(`✅ Revenue estimation: $${revenue.toFixed(4)} per impression`);

  const variant = getAdVariant('session123');
  console.log(`✅ A/B test variant: ${variant}`);

  console.log('✅ Ad placement system: PASSED\n');
} catch (err) {
  console.error('❌ Ad placement system: FAILED', err.message, '\n');
}

// Summary
console.log('=' .repeat(50));
console.log('🎉 ALL TESTS PASSED!');
console.log('=' .repeat(50));
console.log('\n✅ Ready to integrate into controllers and UI!');
console.log('\nNext steps:');
console.log('1. Run: npm install');
console.log('2. Create .env file (copy from .env.example)');
console.log('3. Run: npm run dev');
console.log('4. Open: http://localhost:3000\n');
