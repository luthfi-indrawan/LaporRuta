const express = require("express");
const MasterDataController = require("../controllers/MasterDataController");

const router = express.Router();
router.get(
  "/categories",
  MasterDataController.getCategories.bind(MasterDataController),
);
router.get(
  "/wilayah",
  MasterDataController.getWilayah.bind(MasterDataController),
);
module.exports = router;
