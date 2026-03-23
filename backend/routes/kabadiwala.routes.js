const router = require("express").Router();
const controller = require("../controllers/kabadiwala.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/profile",   authenticate, authorize("kabadiwala"), controller.getProfile);
router.get("/pickups",   authenticate, authorize("kabadiwala"), controller.getPickups);
router.post("/complete-pickup", authenticate, authorize("kabadiwala"), controller.completePickup);
router.patch("/pickups/:assignmentId/status", authenticate, authorize("kabadiwala"), controller.updatePickupStatus);
router.get("/earnings",  authenticate, authorize("kabadiwala"), controller.getEarnings);

module.exports = router;
