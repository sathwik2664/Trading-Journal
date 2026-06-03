const Setup = require('../models/Setup');

const getSetups = async (req, res) => {
  try {
    const setups = await Setup.find().sort({ createdAt: -1 });
    res.json(setups);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createSetup = async (req, res) => {
  try {
    const setup = await Setup.create(req.body);
    res.status(201).json(setup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const updateSetup = async (req, res) => {
  try {
    const setup = await Setup.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!setup) return res.status(404).json({ message: 'Setup not found' });
    res.json(setup);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

const deleteSetup = async (req, res) => {
  try {
    await Setup.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getSetups, createSetup, updateSetup, deleteSetup };