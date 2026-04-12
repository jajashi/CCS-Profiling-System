const express = require("express");
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} = require("../controllers/studentController");
const { authenticate, requireRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", authenticate, requireRoles("admin", "faculty", "student"), getStudents);
router.post("/", authenticate, requireRoles("admin"), createStudent);
router.put("/:id", authenticate, requireRoles("admin"), updateStudent);
router.patch("/:id", authenticate, requireRoles("admin"), updateStudent);
router.delete("/:id", authenticate, requireRoles("admin"), deleteStudent);

module.exports = router;
