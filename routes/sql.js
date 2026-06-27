const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const SqlQuery = require('../models/SqlQuery');

// @route   GET api/sql
// @desc    Get user's SQL query history
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const queries = await SqlQuery.find({ owner: req.user.id }).sort({ createdAt: -1 });
    res.json(queries);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/sql
// @desc    Save an SQL query to history
// @access  Private
router.post('/', auth, async (req, res) => {
  const { prompt, sqlCode, executionTime, status } = req.body;

  try {
    const newQuery = new SqlQuery({
      prompt,
      sqlCode,
      executionTime: executionTime || Math.floor(Math.random() * 120) + 15,
      status: status || 'Success',
      owner: req.user.id
    });

    const query = await newQuery.save();
    res.json(query);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/sql/:id/favorite
// @desc    Toggle favorite state of query
// @access  Private
router.put('/:id/favorite', auth, async (req, res) => {
  try {
    let query = await SqlQuery.findOne({ _id: req.params.id, owner: req.user.id });
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    query.isFavorite = !query.isFavorite;
    await query.save();
    res.json(query);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/sql/:id
// @desc    Delete a query from history
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const query = await SqlQuery.findOne({ _id: req.params.id, owner: req.user.id });
    if (!query) {
      return res.status(404).json({ message: 'Query not found' });
    }

    await SqlQuery.deleteOne({ _id: req.params.id });
    res.json({ message: 'Query history record deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
