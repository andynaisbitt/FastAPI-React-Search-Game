// utils/game/performSearch.js
const { google } = require('googleapis');
const customsearch = google.customsearch('v1');
const { analyzeSearchResults } = require('./analyzeSearchResults');
const winston = require('winston');

const apiKey = process.env.GOOGLE_API_KEY;
const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

const customSearchClient = google.customsearch({ version: 'v1', auth: apiKey });

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

async function performSearch(query, longUrl, page = 1, resultsPerPage = 10) {
  try {
    const startIndex = (page - 1) * resultsPerPage + 1;
    logger.info(`Performing search for query: "${query}" (page: ${page}, results per page: ${resultsPerPage})`);
    const searchResponse = await executeSearch(query, startIndex, resultsPerPage);
    const processedResults = processSearchResponse(searchResponse, longUrl, page, resultsPerPage);
    logger.info(`Search completed. Total results: ${processedResults.totalResults}`);
    return processedResults;
  } catch (error) {
    logger.error('Error performing search:', error);
    throw error;
  }
}

async function performLiveSearch(query, longUrl, options = {}) {
  try {
    const startIndex = options.startIndex || 1;
    const numResults = options.numResults || 5;
    logger.info(`Performing live search for query: "${query}" (start index: ${startIndex}, num results: ${numResults})`);
    const searchResponse = await executeSearch(query, startIndex, numResults);
    const processedResults = processSearchResponse(searchResponse, longUrl);
    logger.info(`Live search completed. Total results: ${processedResults.totalResults}`);
    return processedResults;
  } catch (error) {
    logger.error('Error performing live search:', error);
    throw error;
  }
}

async function executeSearch(query, startIndex, numResults) {
  const searchRequest = {
    q: query,
    cx: searchEngineId,
    num: numResults,
    start: startIndex,
    fields: 'queries(nextPage),items(title,link,snippet,pagemap),searchInformation(totalResults)',
  };

  logger.info(`Executing search request: ${JSON.stringify(searchRequest)}`);
  const searchResponse = await customSearchClient.cse.list(searchRequest);

  if (searchResponse.data.error) {
    logger.error('Search API error:', searchResponse.data.error);
    throw new Error('Search API error');
  }

  logger.info(`Search response received. Total results: ${searchResponse.data.searchInformation.totalResults}`);
  return searchResponse.data;
}

function processSearchResponse(searchResponse, longUrl, page, resultsPerPage) {
  if (!searchResponse || !searchResponse.items) {
    logger.error('Search API error: No items in response');
    throw new Error('Search API error: No items in response');
  }

  const searchResults = searchResponse.items.map((item) => ({
    title: item.title,
    url: item.link,
    snippet: item.snippet,
    thumbnail: item.pagemap?.cse_thumbnail?.[0]?.src || null,
  }));

  logger.info(`Processing search response. Number of results: ${searchResults.length}`);
  const analyzedResults = analyzeSearchResults(searchResults, longUrl);

  const processedResults = {
    ...analyzedResults,
    totalResults: parseInt(searchResponse.searchInformation.totalResults, 10),
    currentPage: page,
    resultsPerPage,
    hasMoreResults: searchResponse.queries.nextPage !== undefined,
  };

  logger.info(`Processed search results: ${JSON.stringify(processedResults)}`);
  return processedResults;
}

module.exports = {
  performSearch,
  performLiveSearch,
};