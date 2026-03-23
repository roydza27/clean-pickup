const router = require("express").Router();
const controller = require("../controllers/auth.controller");
const authenticate = require("../middleware/authenticate");

router.post("/send-otp", controller.sendOTP);
router.post("/verify-otp", controller.verifyOTP);
router.post("/logout", authenticate, controller.logout);

module.exports = router;


