// utils/urlShortener/errorHandler.js
class InvalidURLError extends Error {
    constructor(message) {
      super(message);
      this.name = 'InvalidURLError';
    }
  }
  
  class ShortCodeNotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ShortCodeNotFoundError';
    }
  }
  
  class ShortCodeExistsError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ShortCodeExistsError';
    }
  }
  
  function errorHandler(err, req, res, next) {
    if (err instanceof InvalidURLError) {
      res.status(400).json({ error: err.message });
    } else if (err instanceof ShortCodeNotFoundError) {
      res.status(404).json({ error: err.message });
    } else if (err instanceof ShortCodeExistsError) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
  
  module.exports = {
    InvalidURLError,
    ShortCodeNotFoundError,
    ShortCodeExistsError,
    errorHandler,
  };