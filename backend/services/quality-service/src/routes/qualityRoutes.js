const express = require('express');
const { verifyToken, requireTeacher } = require('../middlewares/authMiddleware');
const { getDashboard } = require('../services/qualityService');

const router = express.Router();

router.use(verifyToken, requireTeacher);

router.get('/dashboard', async (req, res, next) => {
    try {
        const result = await getDashboard({ refresh: req.query.refresh === 'true' });
        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return next(error);
    }
});

module.exports = router;
