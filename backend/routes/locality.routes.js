const router = require("express").Router();
const controller = require("../controllers/locality.controller");

router.get("/", controller.getAllLocalities);
router.get("/pincode/:pincode", controller.getByPincode);

module.exports = router;
