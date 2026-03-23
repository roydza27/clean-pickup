const router = require("express").Router();
const controller = require("../controllers/citizen.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/profile",     authenticate, authorize("citizen"), controller.getProfile);
router.put("/profile",     authenticate, authorize("citizen"), controller.updateProfile);
router.put("/preferences", authenticate, authorize("citizen"), controller.updatePreferences);
router.get("/history",     authenticate, authorize("citizen"), controller.getPickupHistory);

module.exports = router;
