const router = require("express").Router();
const controller = require("../controllers/scrapRate.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/:localityId", controller.getRates);
router.post("/",           authenticate, authorize("admin"), controller.updateRate);

module.exports = router;
