const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// Crear cliente S3
// Usa S3_ACCESS_KEY_ID en producción (Lambda) para evitar conflicto con AWS CLI
// Fallback a AWS_ACCESS_KEY_ID para desarrollo local
const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET = process.env.AWS_S3_BUCKET;

/**
 * Sube una imagen a S3
 * @param {Buffer} buffer - Buffer de la imagen
 * @param {string} sku - SKU del producto
 * @param {string} mimetype - Tipo MIME (image/jpeg, image/png, etc.)
 * @returns {Promise<string>} URL pública de la imagen
 */
async function uploadImage(buffer, sku, mimetype) {
  const ext = mimetype.split('/')[1] || 'jpg';
  const key = `fichas/${sku}/${Date.now()}.${ext}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype
  }));

  return `https://${BUCKET}.s3.${process.env.AWS_S3_REGION || 'us-east-1'}.amazonaws.com/${key}`;
}

/**
 * Elimina una imagen de S3
 * @param {string} url - URL completa de la imagen en S3
 */
async function deleteImage(url) {
  if (!url || !BUCKET || !url.includes(BUCKET)) {
    return; // No es una imagen de S3 o no hay bucket configurado
  }

  try {
    // Extraer la key de la URL
    const key = url.split('.amazonaws.com/')[1];
    if (!key) return;

    await s3Client.send(new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key
    }));
  } catch (error) {
    console.error('Error eliminando imagen de S3:', error);
    // No lanzar error para no interrumpir operaciones principales
  }
}

/**
 * Verifica si el servicio S3 está configurado
 * @returns {boolean}
 */
function isConfigured() {
  const accessKey = process.env.S3_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
  const secretKey = process.env.S3_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
  return !!(BUCKET && accessKey && secretKey);
}

module.exports = {
  uploadImage,
  deleteImage,
  isConfigured
};
