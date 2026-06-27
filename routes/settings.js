const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Setting = require('../models/Setting');

// @route   GET api/settings
// @desc    Get user settings
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let settings = await Setting.findOne({ owner: req.user.id });
    if (!settings) {
      // Create defaults if somehow not exist
      settings = new Setting({ owner: req.user.id });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/settings
// @desc    Update user settings
// @access  Private
router.put('/', auth, async (req, res) => {
  const { animationSpeed, notifyAnalysis, notifyReport, notifyPrediction, activeApiKey } = req.body;

  try {
    let settings = await Setting.findOne({ owner: req.user.id });
    if (!settings) {
      settings = new Setting({ owner: req.user.id });
    }

    if (animationSpeed !== undefined) settings.animationSpeed = animationSpeed;
    if (notifyAnalysis !== undefined) settings.notifyAnalysis = notifyAnalysis;
    if (notifyReport !== undefined) settings.notifyReport = notifyReport;
    if (notifyPrediction !== undefined) settings.notifyPrediction = notifyPrediction;
    if (activeApiKey !== undefined) settings.activeApiKey = activeApiKey;
    
    settings.updatedAt = Date.now();

    await settings.save();
    res.json(settings);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
