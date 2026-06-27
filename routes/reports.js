const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');

// @route   GET api/reports
// @desc    Get all user reports
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const reports = await Report.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/reports
// @desc    Create a new report
// @access  Private
router.post('/', auth, async (req, res) => {
  const { title, datasetId, chartsConfig, insightsText, predictionsConfig } = req.body;

  try {
    const newReport = new Report({
      title,
      datasetId,
      chartsConfig,
      insightsText,
      predictionsConfig,
      owner: req.user.id
    });

    const report = await newReport.save();
    res.json(report);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/reports/:id
// @desc    Delete a report
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findOne({ _id: req.params.id, owner: req.user.id });
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    await Report.deleteOne({ _id: req.params.id });
    res.json({ message: 'Report deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
