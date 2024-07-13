// utils/game/generateHint.js
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

function generateHint(analyzedUrl, hintLevel) {
  if (!analyzedUrl || !analyzedUrl.domain || !analyzedUrl.relatedKeywords || !analyzedUrl.searchOperators) {
    const defaultHint = 'Try searching for the original URL using relevant keywords and search operators.';
    logger.warn(`Invalid analyzedUrl object. Returning default hint: ${defaultHint}`);
    return defaultHint;
  }

  const { domain, relatedKeywords, searchOperators } = analyzedUrl;

  const hintTypes = [
    generateDomainHint,
    generateRelatedKeywordsHint,
    generateSearchOperatorsHint,
    generateGeneralHint,
  ];

  const hintGenerator = hintTypes[hintLevel - 1];

  const generatedHint = hintGenerator(domain, relatedKeywords, searchOperators);
  logger.info(`Generated hint (level ${hintLevel}): ${generatedHint}`);
  return generatedHint;
}

function generateDomainHint(domain) {
  const hintTemplates = [
    `The original URL is from the domain "${domain}"`,
    `Focus your search on the domain "${domain}"`,
    `The website you're looking for is hosted on "${domain}"`,
    `Try searching within the "${domain}" domain`,
  ];

  const randomIndex = Math.floor(Math.random() * hintTemplates.length);
  const selectedHint = hintTemplates[randomIndex];
  logger.info(`Generated domain hint: ${selectedHint}`);
  return selectedHint;
}

function generateRelatedKeywordsHint(relatedKeywords) {
  if (!Array.isArray(relatedKeywords) || relatedKeywords.length === 0) {
    const defaultHint = 'Try using relevant keywords in your search.';
    logger.warn(`Invalid relatedKeywords array. Returning default hint: ${defaultHint}`);
    return defaultHint;
  }

  const randomKeywords = getRandomSubset(relatedKeywords, 3);
  const keywordsString = randomKeywords.join(', ');

  const hintTemplates = [
    `Try using the keywords "${keywordsString}" in your search`,
    `The search result is related to "${keywordsString}"`,
    `Consider including "${keywordsString}" in your search query`,
    `The original URL might contain the keywords "${keywordsString}"`,
  ];

  const randomIndex = Math.floor(Math.random() * hintTemplates.length);
  const selectedHint = hintTemplates[randomIndex];
  logger.info(`Generated related keywords hint: ${selectedHint}`);
  return selectedHint;
}

function generateSearchOperatorsHint(searchOperators) {
  const randomOperator = getRandomElement(searchOperators);

  const hintTemplates = [
    `Use the search operator "${randomOperator}" to narrow down your search`,
    `Try including "${randomOperator}" in your search query`,
    `The "${randomOperator}" search operator might help you find the original URL`,
    `Modify your search query with "${randomOperator}" to get more specific results`,
  ];

  const randomIndex = Math.floor(Math.random() * hintTemplates.length);
  const selectedHint = hintTemplates[randomIndex];
  logger.info(`Generated search operators hint: ${selectedHint}`);
  return selectedHint;
}

function generateGeneralHint() {
  const hintTemplates = [
    'Try different combinations of keywords in your search',
    'Consider using synonyms or related terms in your search query',
    'Look for search results that closely match the game question',
    'Pay attention to the website titles and descriptions in the search results',
    'Refine your search query based on the information provided in the search snippets',
  ];

  const randomIndex = Math.floor(Math.random() * hintTemplates.length);
  const selectedHint = hintTemplates[randomIndex];
  logger.info(`Generated general hint: ${selectedHint}`);
  return selectedHint;
}

function getRandomSubset(array, size) {
  const shuffled = array.slice();
  let i = array.length;
  let temp;
  let index;

  while (i--) {
    index = Math.floor((i + 1) * Math.random());
    temp = shuffled[index];
    shuffled[index] = shuffled[i];
    shuffled[i] = temp;
  }

  const subset = shuffled.slice(0, size);
  logger.info(`Generated random subset: ${subset}`);
  return subset;
}

function getRandomElement(array) {
  const randomIndex = Math.floor(Math.random() * array.length);
  const selectedElement = array[randomIndex];
  logger.info(`Selected random element: ${selectedElement}`);
  return selectedElement;
}

module.exports = generateHint;