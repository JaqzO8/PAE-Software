const GamificationService = require('../services/gamificationService');

class GamificationController {
    static async getSummary(req, res, next) {
        try {
            const shouldSyncHistory = req.query.sync === 'true';
            const summary = shouldSyncHistory
                ? await GamificationService.syncProfileFromHistory(req.user)
                : await GamificationService.getSummary(req.user);
            return res.status(200).json({ success: true, data: summary });
        } catch (error) {
            return next(error);
        }
    }

    static async getLeaderboard(req, res, next) {
        try {
            const leaderboard = await GamificationService.getLeaderboard(req.query.limit);
            return res.status(200).json({ success: true, data: leaderboard });
        } catch (error) {
            return next(error);
        }
    }

    static async completeOnboardingStep(req, res, next) {
        try {
            const summary = await GamificationService.completeOnboardingStep(req.user, req.params.stepId);
            return res.status(200).json({ success: true, data: summary });
        } catch (error) {
            if (error.status) {
                return res.status(error.status).json({ success: false, message: error.message });
            }
            return next(error);
        }
    }

    static async getSettings(req, res, next) {
        try {
            const settings = await GamificationService.getSettings();
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return next(error);
        }
    }

    static async updateSettings(req, res, next) {
        try {
            const allowed = [
                'attemptCompletedPoints',
                'highAccuracyBonusPoints',
                'highAccuracyThreshold',
                'livePointsRatio',
                'onboardingStepPoints',
                'baseLevelPoints',
                'levelPointsIncrement',
                'leaderboardLimit',
                'onboardingSteps',
            ];
            const payload = Object.fromEntries(
                Object.entries(req.body || {}).filter(([key]) => allowed.includes(key))
            );
            const settings = await GamificationService.updateSettings(payload);
            return res.status(200).json({ success: true, data: settings });
        } catch (error) {
            return next(error);
        }
    }
}

module.exports = GamificationController;
