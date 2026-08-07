const express = require("express");
const CommentsController = require("../controllers/CommentsController");
const authMiddleware = require("../middlewares/auth");
const roleMiddleware = require("../middlewares/roleMiddleware");
const Roles = require("../constants/role");
const router = express.Router({
  mergeParams: true,
});
router.get("/", CommentsController.getComments.bind(CommentsController));
router.post(
  "/",
  authMiddleware,
  roleMiddleware(Roles.User),
  CommentsController.create.bind(CommentsController),
);

module.exports = router;
