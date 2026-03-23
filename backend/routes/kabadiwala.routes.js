const router = require("express").Router();
const controller = require("../controllers/kabadiwala.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

router.get("/pickups", auth, role("kabadiwala"), controller.getPickups);
router.post("/complete-pickup", auth, role("kabadiwala"), controller.completePickup);
router.get("/earnings", auth, role("kabadiwala"), controller.getEarnings);

module.exports = router;
