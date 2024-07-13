// utils\game\analyzeSearchResults.js
const { isSimilarDomain } = require('../urlUtils');
const natural = require('natural');
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

function analyzeSearchResults(searchResults, longUrl) {
  logger.info(`Analyzing search results for URL: ${longUrl}`);

  const winningResult = searchResults.find((result) => isSimilarDomain(result.url, longUrl));
  const relevantResults = searchResults.filter((result) => result.url !== winningResult?.url && isSimilarDomain(result.url, longUrl));

  const titleKeywords = winningResult ? extractKeywords(winningResult.title) : [];
  const snippetKeywords = winningResult ? extractKeywords(winningResult.snippet) : [];
  const commonKeywords = titleKeywords.filter((keyword) => snippetKeywords.includes(keyword));

  const analyzedResults = {
    results: searchResults.map((result) => ({
      ...result,
      isWinning: result === winningResult,
      isRelevant: relevantResults.includes(result),
    })),
    winningResult,
    relevantResults,
    titleKeywords,
    snippetKeywords,
    commonKeywords,
  };

  logger.info(`Analyzed search results: ${JSON.stringify(analyzedResults)}`);
  logger.info(`Winning result: ${JSON.stringify(winningResult)}`);
  logger.info(`Relevant results: ${JSON.stringify(relevantResults)}`);
  logger.info(`Title keywords: ${titleKeywords}`);
  logger.info(`Snippet keywords: ${snippetKeywords}`);
  logger.info(`Common keywords: ${commonKeywords}`);

  return analyzedResults;
}

function extractKeywords(text) {
  if (!text) {
    logger.warn('Empty text provided for keyword extraction');
    return [];
  }

  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text.toLowerCase());
  
  // Remove stopwords
  const stopwords = new Set(natural.stopwords);
  const filteredTokens = tokens.filter(token => !stopwords.has(token));
  
  // Perform stemming
  const stemmer = natural.PorterStemmer;
  const stems = filteredTokens.map(token => stemmer.stem(token));
  
  // Remove duplicates
  const uniqueStems = [...new Set(stems)];

  logger.info(`Extracted keywords: ${uniqueStems}`);

  return uniqueStems;
}

module.exports = {
  analyzeSearchResults,
  extractKeywords,
};