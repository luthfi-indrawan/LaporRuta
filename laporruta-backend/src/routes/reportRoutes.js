const express = require("express");
const ReportController = require("../controllers/ReportController");
const authMiddleware = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  upload.array("images", 3),
  ReportController.create
);

router.get(
  "/my",
  authMiddleware,
  ReportController.getMyReports
);

router.get(
  "/my/:id",
  authMiddleware,
  ReportController.getMyReportDetail
);

router.post(
  "/:id/dispute",
  authMiddleware,
  ReportController.dispute
);

module.exports = router;