const express = require("express");
const ActivityLogsController = require("../controllers/ActivityLogsController");

const router = express.Router({
  mergeParams: true,
});

router.get(
  "/",
  ActivityLogsController.getTimeline.bind(ActivityLogsController),
);

module.exports = router;
