const fs = require('fs');
const path = require('path');

const IMAGE_DIRECTORY = path.resolve(__dirname, '../media');
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

function getBrandImagePaths() {
  try {
    return fs.readdirSync(IMAGE_DIRECTORY, { withFileTypes: true })
      .filter((entry) => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map((entry) => path.join(IMAGE_DIRECTORY, entry.name))
      .sort();
  } catch (_) {
    return [];
  }
}

function getRandomBrandImagePath() {
  const imagePaths = getBrandImagePaths();
  if (!imagePaths.length) return null;
  return imagePaths[Math.floor(Math.random() * imagePaths.length)];
}

function readRandomBrandImage() {
  const imagePath = getRandomBrandImagePath();
  if (!imagePath) return null;
  try {
    return fs.readFileSync(imagePath);
  } catch (_) {
    return null;
  }
}

module.exports = {
  getBrandImagePaths,
  getRandomBrandImagePath,
  readRandomBrandImage,
};
