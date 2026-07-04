const { v2: cloudinary } = require('cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a file buffer (from Multer memoryStorage) to Cloudinary and
 * returns the secure URL. Used for winner proof screenshots since Vercel's
 * filesystem is read-only/ephemeral outside /tmp.
 */
function uploadBufferToCloudinary(buffer, folder = 'winner-proofs') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });
}

module.exports = { cloudinary, uploadBufferToCloudinary };
