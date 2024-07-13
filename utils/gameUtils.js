// utils/gameUtils.js
const analyzeUrl = require('./game/analyzeUrl');
const generateHint = require('./game/generateHint');
const { performSearch, performLiveSearch } = require('./game/performSearch');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

async function analyzeUrlWithLogging(longUrl) {
  try {
    logger.info(`Analyzing URL: ${longUrl}`);
    const analyzedUrl = await analyzeUrl(longUrl);
    logger.info(`Analyzed URL: ${JSON.stringify(analyzedUrl)}`);
    return analyzedUrl;
  } catch (error) {
    logger.error(`Error analyzing URL: ${error.message}`);
    throw error;
  }
}

function generateHintWithLogging(analyzedUrl, hintLevel) {
  try {
    logger.info(`Generating hint for analyzed URL: ${JSON.stringify(analyzedUrl)} (level: ${hintLevel})`);
    const hint = generateHint(analyzedUrl, hintLevel);
    logger.info(`Generated hint: ${hint}`);
    return hint;
  } catch (error) {
    logger.error(`Error generating hint: ${error.message}`);
    throw error;
  }
}

async function performSearchWithLogging(query, longUrl, page = 1, resultsPerPage = 10) {
  try {
    logger.info(`Performing search for query: "${query}" (page: ${page}, results per page: ${resultsPerPage})`);
    const searchResults = await performSearch(query, longUrl, page, resultsPerPage);
    logger.info(`Search completed. Total results: ${searchResults.totalResults}`);
    return searchResults;
  } catch (error) {
    logger.error(`Error performing search: ${error.message}`);
    throw error;
  }
}

async function performLiveSearchWithLogging(query, longUrl, options = {}) {
  try {
    logger.info(`Performing live search for query: "${query}" (options: ${JSON.stringify(options)})`);
    const liveSearchResults = await performLiveSearch(query, longUrl, options);
    logger.info(`Live search completed. Total results: ${liveSearchResults.totalResults}`);
    return liveSearchResults;
  } catch (error) {
    logger.error(`Error performing live search: ${error.message}`);
    throw error;
  }
}

module.exports = {
  analyzeUrlWithLogging,
  generateHintWithLogging,
  performSearchWithLogging,
  performLiveSearchWithLogging,
};