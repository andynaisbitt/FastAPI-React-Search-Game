// utils\urlUtils.js
function isSimilarDomain(url1, url2) {
  try {
    // Normalize URLs by adding protocol if missing
    const normalizeUrl = (url) => url.startsWith('http') ? url : `http://${url}`;
    
    // Extract the hostnames from the normalized URLs
    const domain1 = new URL(normalizeUrl(url1)).hostname.replace(/^www\./, '');
    const domain2 = new URL(normalizeUrl(url2)).hostname.replace(/^www\./, '');

    // Compare the hostnames
    return domain1 === domain2;
  } catch (error) {
    // Handle invalid URLs
    console.error('Error comparing domains:', error);
    return false;
  }
}

function isValidUrl(url) {
  try {
    new URL(url.startsWith('http') ? url : `http://${url}`);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  isSimilarDomain,
  isValidUrl,
};