const express = require("express");

const authRoutes = require("./authRoutes");
const masterDataRoutes = require("./MasterDataRoutes");
const userRoutes = require("./userRoutes");
const uploadRoutes = require("./uploadRoutes");
const activityLogsRoutes = require("./ActivityLogsRoutes");

const router = express.Router();

router.use("/auth", authRoutes);

router.use("/master", masterDataRoutes);

router.use("/users", userRoutes);

router.use("/uploads", uploadRoutes);

router.use("/reports/:id/activity-logs", activityLogsRoutes);

module.exports = router;
