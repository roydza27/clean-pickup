const router = require("express").Router();
const controller = require("../controllers/admin.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/pickups/pending",       authenticate, authorize("admin"), controller.getPendingPickups);
router.get("/pickups",               authenticate, authorize("admin"), controller.getAllPickups);
router.get("/kabadiwalas",           authenticate, authorize("admin"), controller.getKabadiwalas);
router.post("/assign-pickup",        authenticate, authorize("admin"), controller.assignPickup);
router.get("/users",                 authenticate, authorize("admin"), controller.getAllUsers);
router.delete("/users/:userId",      authenticate, authorize("admin"), controller.deactivateUser);
router.post("/localities",           authenticate, authorize("admin"), controller.createLocality);
router.get("/analytics",             authenticate, authorize("admin"), controller.getAnalytics);
router.get("/config",                authenticate, authorize("admin"), controller.getSystemConfig);
router.put("/config",                authenticate, authorize("admin"), controller.updateSystemConfig);

module.exports = router;