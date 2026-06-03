const express = require('express');
const router  = express.Router();
const { getSetups, createSetup, updateSetup, deleteSetup } = require('../controllers/setupController');

router.get('/',       getSetups);
router.post('/',      createSetup);
router.put('/:id',    updateSetup);
router.delete('/:id', deleteSetup);

module.exports = router;