const express = require('express');
const {
  getSpecializations,
  getSpecializationById,
  createSpecialization,
  updateSpecialization,
  deleteSpecialization,
} = require('../controllers/specializationController');

const router = express.Router();

router.get('/', getSpecializations);
router.get('/:id', getSpecializationById);
router.post('/', createSpecialization);
router.put('/:id', updateSpecialization);
router.delete('/:id', deleteSpecialization);

module.exports = router;
