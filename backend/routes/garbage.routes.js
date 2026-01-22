const router = require("express").Router();
const controller = require("../controllers/garbage.controller");
const auth = require("../middleware/auth.middleware");

router.get("/:localityId", controller.getSchedule);
router.post("/missed", auth, controller.reportMissed);

module.exports = router;
