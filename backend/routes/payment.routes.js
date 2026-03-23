const router = require("express").Router();
const controller = require("../controllers/payment.controller");
const authenticate = require("../middleware/authenticate");
const authorize = require("../middleware/authorize");

router.get("/my-payments",          authenticate, authorize("citizen"),          controller.getCitizenPayments);
router.get("/",                     authenticate, authorize("admin"),             controller.getAllPayments);
router.get("/pickup/:requestId",    authenticate, authorize("citizen", "admin"),  controller.getPaymentByPickup);
router.put("/:paymentId/status",    authenticate, authorize("citizen", "admin"),  controller.updateStatus);

module.exports = router;
