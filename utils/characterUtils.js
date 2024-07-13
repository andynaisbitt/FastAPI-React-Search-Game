// utils\characterUtils.js
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

function getRandomCharacterImage() {
  const characterImages = [
    'https://justfuckinggoogleit.co.uk/img/bart-simpson.png',
    'https://justfuckinggoogleit.co.uk/img/lisa-simpson.jpg',
    'https://justfuckinggoogleit.co.uk/img/bart-destroy.webp',
    'https://justfuckinggoogleit.co.uk/img/milhouse-van-houten.jpg'
  ];
  
  if (characterImages.length === 0) {
    logger.warn('No character images available');
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * characterImages.length);
  const selectedImage = characterImages[randomIndex];
  logger.info(`Selected random character image: ${selectedImage}`);
  return selectedImage;
}

function getRandomFact() {
  const facts = [
    'Did you know that Google was originally named "BackRub"?',
    'Google processes over 40,000 search queries every second!',
    'The first Google Doodle was created in 1998 to honor the Burning Man festival.',
    // Add more facts as needed
  ];
  
  if (facts.length === 0) {
    logger.warn('No facts available');
    return null;
  }
  
  const randomIndex = Math.floor(Math.random() * facts.length);
  const selectedFact = facts[randomIndex];
  logger.info(`Selected random fact: ${selectedFact}`);
  return selectedFact;
}

module.exports = {
  getRandomCharacterImage,
  getRandomFact
};