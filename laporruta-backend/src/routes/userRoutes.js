const express = require('express');
const UserController = require('../controllers/UserController');
const validate = require('../middlewares/validate');
const Joi = require('joi');

const router = express.Router();

const userSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  full_name: Joi.string().max(100).optional(),
});

router.get('/', UserController.getAll.bind(UserController));
router.get('/:id', UserController.getById.bind(UserController));
router.post('/', validate(userSchema), UserController.create.bind(UserController));
router.put('/:id', UserController.update.bind(UserController));
router.delete('/:id', UserController.delete.bind(UserController));

module.exports = router;
