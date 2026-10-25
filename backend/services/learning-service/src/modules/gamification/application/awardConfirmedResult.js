const { evaluateRule } = require('../domain/confirmedResult');

function createAwardConfirmedResult({ awards, rule }) {
    // Freeze the approved configuration for this consumer's lifetime.
    const configuredRule = rule && { ...rule };
    return async (event) => {
        const award = evaluateRule(event, configuredRule);
        return awards.grantOnce({ event, award });
    };
}
module.exports = { createAwardConfirmedResult };
