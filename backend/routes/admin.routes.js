const router = require("express").Router();
const controller = require("../controllers/admin.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

router.get("/pickups/pending", auth, role("admin"), controller.getPendingPickups);
router.get("/kabadiwalas", auth, role("admin"), controller.getKabadiwalas);
router.post("/assign-pickup", auth, role("admin"), controller.assignPickup);
router.get("/analytics", auth, role("admin"), controller.getAnalytics);

module.exports = router;