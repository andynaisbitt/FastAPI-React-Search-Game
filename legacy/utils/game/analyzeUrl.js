// utils\game\analyzeUrl.js

const { google } = require('googleapis');
const customsearch = google.customsearch('v1');
const winston = require('winston');

const apiKey = process.env.GOOGLE_API_KEY;

const customSearchClient = google.customsearch({
  version: 'v1',
  auth: apiKey,
});

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

async function analyzeUrl(longUrl) {
  try {
    const searchRequest = {
      q: longUrl,
      cx: process.env.GOOGLE_SEARCH_ENGINE_ID,
      num: 1,
    };

    logger.info(`Analyzing URL: ${longUrl}`);

    const searchResponse = await customSearchClient.cse.list(searchRequest);

    if (searchResponse.data.error) {
      logger.error(`Search API error: ${JSON.stringify(searchResponse.data.error)}`);
      return {
        gameQuestion: 'Find the original URL',
        searchOperators: [],
      };
    } else {
      const searchResult = searchResponse.data.items[0];
      const gameQuestion = generateGameQuestion(searchResult);
      const searchOperators = generateSearchOperators(searchResult);
      const relatedKeywords = extractRelatedKeywords(searchResult);
      const domain = extractDomain(searchResult.link);

      logger.info(`Generated game question: ${gameQuestion}`);
      logger.info(`Generated search operators: ${searchOperators}`);
      logger.info(`Extracted related keywords: ${relatedKeywords}`);
      logger.info(`Extracted domain: ${domain}`);

      return {
        gameQuestion,
        searchOperators,
        relatedKeywords,
        domain,
      };
    }
  } catch (error) {
    logger.error(`Error analyzing URL: ${error.message}`);
    logger.error(error.stack);
    return {
      gameQuestion: 'Find the original URL',
      searchOperators: [],
      relatedKeywords: [],
      domain: '',
    };
  }
}

function generateGameQuestion(searchResult) {
  const title = searchResult.title.toLowerCase();
  const snippet = searchResult.snippet.toLowerCase();

  const keywordPatterns = [
    {
      pattern: /list of|top \d+/,
      question: 'Find the list mentioned in the search result',
    },
    {
      pattern: /tutorial|how to|step by step/,
      question: 'Find the tutorial related to the search result',
    },
    {
      pattern: /wikipedia/,
      question: 'Find the Wikipedia article mentioned in the search result',
    },
    {
      pattern: /definition of|meaning of/,
      question: 'Find the definition or meaning mentioned in the search result',
    },
    {
      pattern: /review of|opinion on/,
      question: 'Find the review or opinion mentioned in the search result',
    },
  ];

  for (const { pattern, question } of keywordPatterns) {
    if (pattern.test(title) || pattern.test(snippet)) {
      logger.info(`Generated game question based on keyword pattern: ${question}`);
      return question;
    }
  }

  const questionTemplates = [
    `Find the page related to "${searchResult.title}"`,
    `Search for information about "${searchResult.title}"`,
    `Look for the article discussing "${searchResult.title}"`,
  ];

  const randomIndex = Math.floor(Math.random() * questionTemplates.length);
  const selectedTemplate = questionTemplates[randomIndex];

  logger.info(`Generated game question based on template: ${selectedTemplate}`);
  return selectedTemplate;
}

function generateSearchOperators(searchResult) {
  const { link, snippet } = searchResult;
  const domain = extractDomain(link);

  const searchOperators = [
    `site:${domain}`,
    `intitle:${extractKeywords(searchResult.title).join(' OR ')}`,
    `intext:${extractKeywords(snippet).join(' OR ')}`,
  ];

  logger.info(`Generated search operators: ${searchOperators}`);
  return searchOperators;
}

function extractRelatedKeywords(searchResult) {
  const { title, snippet } = searchResult;

  const relatedKeywords = [
    ...extractKeywords(title),
    ...extractKeywords(snippet),
  ];

  const uniqueKeywords = [...new Set(relatedKeywords)];
  logger.info(`Extracted related keywords: ${uniqueKeywords}`);
  return uniqueKeywords;
}

function extractKeywords(text) {
  const stopWords = ['the', 'and', 'or', 'but', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'of', 'with'];
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((word) => word.length > 2 && !stopWords.includes(word));

  logger.info(`Extracted keywords: ${words}`);
  return words;
}

function extractDomain(url) {
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname;
  logger.info(`Extracted domain: ${domain}`);
  return domain;
}

module.exports = analyzeUrl;