const router = require("express").Router();
const controller = require("../controllers/auth.controller");

router.post("/send-otp", controller.sendOTP);
router.post("/verify-otp", controller.verifyOTP);

module.exports = router;


