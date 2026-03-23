const router = require("express").Router();
const controller = require("../controllers/garbage.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/",                  controller.getAllSchedules);
router.get("/:localityId",       controller.getSchedule);
router.post("/missed",           authenticate, controller.reportMissed);
router.get("/missed/reports",    authenticate, authorize("admin"), controller.getMissedReports);

module.exports = router;
