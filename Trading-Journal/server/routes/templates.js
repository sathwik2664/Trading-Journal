const express = require('express');
const router = express.Router();
const {
  getAllTemplates,
  createTemplate,
  deleteTemplate
} = require('../controllers/templateController');

router.get('/', getAllTemplates);
router.post('/', createTemplate);
router.delete('/:id', deleteTemplate);

module.exports = router;