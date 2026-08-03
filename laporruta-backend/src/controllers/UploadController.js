const BaseController = require('./BaseController');
const UploadService = require('../services/UploadService');

class UploadController extends BaseController {
  constructor() {
    super(UploadService);
  }

  async uploadSingle(req, res, next) {
    try {
      if (!req.file) {
        return this.sendError(res, 'No file uploaded', 400);
      }
      const folder = req.body.folder || 'uploads';
      const data = await UploadService.uploadSingle(req.file, folder);
      return this.sendSuccess(res, data, 'File uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async uploadMultiple(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return this.sendError(res, 'No files uploaded', 400);
      }
      const folder = req.body.folder || 'uploads';
      const data = await UploadService.uploadMultiple(req.files, folder);
      return this.sendSuccess(res, data, 'Files uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async deleteFile(req, res, next) {
    try {
      const { filePath } = req.body;
      await UploadService.deleteFile(filePath);
      return this.sendSuccess(res, null, 'File deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UploadController();
