const express = require("express");
const AdminPusatController = require("../controllers/AdminPusatController");
const authMiddleware = require("../middlewares/auth");
const roleMiddleware = require("../middlewares/roleMiddleware");
const Roles = require("../constants/role");

const router = express.Router();

router.get(
  "/reports",
  authMiddleware,
  roleMiddleware(Roles.AdminPusat),
  AdminPusatController.getAllReports.bind(AdminPusatController),
);
router.get(
  "/reports/zoneless",
  authMiddleware,
  roleMiddleware(Roles.AdminPusat),
  AdminPusatController.getZonelessReports.bind(AdminPusatController),
);
router.patch(
  "/reports/:id/status",
  authMiddleware,
  roleMiddleware(Roles.AdminPusat),
  AdminPusatController.overrideReportStatus.bind(AdminPusatController),
);
router.put(
  "/reports/:id/zone",
  authMiddleware,
  roleMiddleware(Roles.AdminPusat),
  AdminPusatController.reassignReportZone.bind(AdminPusatController),
);
router.put(
  "/reports/:id",
  authMiddleware,
  roleMiddleware(Roles.AdminPusat),
  AdminPusatController.editReportMetadata.bind(AdminPusatController),
);
module.exports = router;
