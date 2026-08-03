const express = require('express');
const UploadController = require('../controllers/UploadController');
const { upload } = require('../middlewares/upload');

const router = express.Router();

router.post('/single', upload.single('file'), UploadController.uploadSingle.bind(UploadController));
router.post('/multiple', upload.array('files', 10), UploadController.uploadMultiple.bind(UploadController));
router.delete('/', UploadController.deleteFile.bind(UploadController));

module.exports = router;
