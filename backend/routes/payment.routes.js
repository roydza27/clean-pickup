const router = require("express").Router();
const controller = require("../controllers/payment.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

router.get("/citizen", auth, role("citizen"), controller.getCitizenPayments);
router.put("/:paymentId/status", auth, controller.updateStatus);

module.exports = router;
