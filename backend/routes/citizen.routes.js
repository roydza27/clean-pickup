const router = require("express").Router();
const controller = require("../controllers/citizen.controller");
const auth = require("../middleware/auth.middleware");
const role = require("../middleware/role.middleware");

router.get("/profile", auth, role("citizen"), controller.getProfile);
router.put("/profile", auth, role("citizen"), controller.updateProfile);
router.put("/preferences", auth, role("citizen"), controller.updatePreferences);

module.exports = router;
