const express = require('express');
const userRoutes = require('./userRoutes');
const uploadRoutes = require('./uploadRoutes');

const router = express.Router();

router.use('/users', userRoutes);
router.use('/uploads', uploadRoutes);

module.exports = router;
