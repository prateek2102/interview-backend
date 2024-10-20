const express = require('express');
const router = express.Router();
const { createJob } = require('../controllers/jobController');
const auth = require('../middleware/auth');

router.post('/job', auth, createJob);

module.exports = router;
