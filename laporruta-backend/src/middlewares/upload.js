const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const supabaseStorage = require('../config/supabase');

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, and PDF are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

const uploadToSupabase = async (file, folder = 'uploads') => {
  const ext = path.extname(file.originalname);
  const fileName = `${folder}/${uuidv4()}${ext}`;

  await supabaseStorage.upload(fileName, file.buffer, file.mimetype);
  const publicUrl = await supabaseStorage.getPublicUrl(fileName);

  return {
    fileName,
    publicUrl,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
  };
};

const deleteFromSupabase = async (filePath) => {
  return await supabaseStorage.delete(filePath);
};

module.exports = {
  upload,
  uploadToSupabase,
  deleteFromSupabase,
};
