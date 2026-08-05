const express = require("express");
const AuthController = require("../controllers/AuthController");
const validate = require("../middlewares/validate");
const authMiddleware = require("../middlewares/auth");
const Joi = require("joi");

const router = express.Router();

const registerSchema = Joi.object({
  full_name: Joi.string().max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  confirm_password: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Konfirmasi password harus sama dengan password",
    }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

router.post(
  "/register",
  validate(registerSchema),
  AuthController.register.bind(AuthController),
);
router.post(
  "/login",
  validate(loginSchema),
  AuthController.login.bind(AuthController),
);
router.post("/refresh", AuthController.refresh.bind(AuthController));
router.post(
  "/logout",
  authMiddleware,
  AuthController.logout.bind(AuthController),
);
router.get("/me", authMiddleware, AuthController.me.bind(AuthController));

module.exports = router;
