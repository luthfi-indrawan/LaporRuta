const { uploadToSupabase, deleteFromSupabase } = require('../middlewares/upload');

class UploadService {
  async uploadSingle(file, folder = 'uploads') {
    return await uploadToSupabase(file, folder);
  }

  async uploadMultiple(files, folder = 'uploads') {
    const uploadPromises = files.map(file => uploadToSupabase(file, folder));
    return await Promise.all(uploadPromises);
  }

  async deleteFile(filePath) {
    return await deleteFromSupabase(filePath);
  }
}

module.exports = new UploadService();
