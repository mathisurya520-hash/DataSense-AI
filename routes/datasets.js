const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Dataset = require('../models/Dataset');

// @route   GET api/datasets
// @desc    Get all user datasets
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const datasets = await Dataset.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(datasets);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/datasets/:id
// @desc    Get specific dataset details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({ _id: req.params.id, owner: req.user.id });
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    res.json(dataset);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   POST api/datasets
// @desc    Save uploaded/parsed CSV dataset
// @access  Private
router.post('/', auth, async (req, res) => {
  const {
    name,
    headers,
    rows,
    columnsCount,
    rowsCount,
    qualityScore,
    missingValuesCount,
    duplicatesCount
  } = req.body;

  try {
    const newDataset = new Dataset({
      name,
      headers,
      rows,
      columnsCount,
      rowsCount,
      qualityScore: qualityScore || 100,
      missingValuesCount: missingValuesCount || 0,
      duplicatesCount: duplicatesCount || 0,
      owner: req.user.id
    });

    const dataset = await newDataset.save();
    res.json(dataset);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/datasets/:id/clean
// @desc    Clean missing/duplicate rows of a dataset
// @access  Private
router.post('/:id/clean', auth, async (req, res) => {
  try {
    let dataset = await Dataset.findOne({ _id: req.params.id, owner: req.user.id });
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    // Perform simulated cleaning on backend
    // Remove duplicates from rows in-memory
    let cleanRows = [];
    const seen = new Set();
    dataset.rows.forEach(row => {
      const serialized = JSON.stringify(row);
      if (!seen.has(serialized)) {
        seen.add(serialized);
        // Fill nulls/nils with defaults
        const filledRow = { ...row };
        Object.keys(filledRow).forEach(key => {
          if (filledRow[key] === null || filledRow[key] === undefined || filledRow[key] === '') {
            if (typeof filledRow[key] === 'number') {
              filledRow[key] = 0;
            } else {
              filledRow[key] = 'N/A';
            }
          }
        });
        cleanRows.push(filledRow);
      }
    });

    dataset.rows = cleanRows;
    dataset.rowsCount = cleanRows.length;
    dataset.qualityScore = 100;
    dataset.missingValuesCount = 0;
    dataset.duplicatesCount = 0;

    await dataset.save();
    res.json(dataset);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/datasets/:id
// @desc    Delete a dataset
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({ _id: req.params.id, owner: req.user.id });
    if (!dataset) {
      return res.status(404).json({ message: 'Dataset not found' });
    }

    await Dataset.deleteOne({ _id: req.params.id });
    res.json({ message: 'Dataset removed successfully' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Dataset not found' });
    }
    res.status(500).send('Server error');
  }
});

module.exports = router;
