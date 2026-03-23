const router = require("express").Router();
const controller = require("../controllers/pickup.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

// Create pickup request (Citizen)
router.post(
  "/request",
  authenticate,
  authorize("citizen"),
  controller.createPickupRequest
);

// Get citizen's own pickup requests
router.get(
  "/my-requests",
  authenticate,
  authorize("citizen"),
  controller.getMyPickupRequests
);

// Get single pickup (citizen sees own; admin sees all)
router.get(
  "/:requestId",
  authenticate,
  authorize("citizen", "admin"),
  controller.getPickupById
);

// Cancel pickup (citizen)
router.post(
  "/:requestId/cancel",
  authenticate,
  authorize("citizen"),
  controller.cancelPickup
);

// Update pickup address (citizen, only when status=requested)
router.patch(
  "/:requestId/address",
  authenticate,
  authorize("citizen"),
  controller.updatePickupAddress
);

module.exports = router;
