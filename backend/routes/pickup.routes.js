const router = require("express").Router();

const pickupController = require("../controllers/pickup.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authorizeRole = require("../middleware/role.middleware");

// Create pickup request (Citizen)
router.post(
  "/request",
  authenticateToken,
  authorizeRole("citizen"),
  pickupController.createPickupRequest
);

// Get citizen pickup requests
router.get(
  "/my-requests",
  authenticateToken,
  authorizeRole("citizen"),
  pickupController.getMyPickupRequests
);

module.exports = router;
