const router = require("express").Router();
const controller = require("../controllers/scrapRate.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

router.get("/:localityId", controller.getRates);
router.post("/", auth, role("admin"), controller.updateRate);

module.exports = router;
