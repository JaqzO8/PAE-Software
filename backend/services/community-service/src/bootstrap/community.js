const { createHash } = require('node:crypto');
const { createCommunityUseCases } = require('../application/communityUseCases');
const { createUnitOfWork } = require('../infrastructure/sequelizeCommunityRepository');
const { sequelize } = require('../config/database');
const models = require('../models');
const config = require('../config/env');
const { findStudent } = require('../infrastructure/identityDirectory');

module.exports = createCommunityUseCases({
    findStudent,
    unitOfWork: createUnitOfWork({ sequelize, ...models }),
    clock: { now: () => new Date() },
    invitationTtlMs: config.INVITATION_TTL_HOURS * 60 * 60 * 1000,
    hash: (content) => createHash('sha256').update(content).digest('hex'),
});

