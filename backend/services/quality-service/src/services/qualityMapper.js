const RATING_LABELS = Object.freeze({
    1: 'A',
    2: 'B',
    3: 'C',
    4: 'D',
    5: 'E',
});

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toRating = (value) => RATING_LABELS[toNumber(value)] || 'N/A';

const indexMeasures = (measures = []) => Object.fromEntries(
    measures.map(({ metric, value }) => [metric, value]),
);

const normalizeGateStatus = (status) => {
    if (status === 'OK') return 'passed';
    if (status === 'ERROR') return 'failed';
    return 'unknown';
};

const normalizeCondition = (condition) => ({
    metric: condition.metricKey,
    status: condition.status === 'OK' ? 'passed' : 'failed',
    comparator: condition.comparator,
    threshold: toNumber(condition.errorThreshold),
    actual: toNumber(condition.actualValue),
});

const mapDashboard = ({ measuresResponse, gateResponse, publicUrl, generatedAt }) => {
    const component = measuresResponse?.component || {};
    const values = indexMeasures(component.measures);
    const gate = gateResponse?.projectStatus || {};

    return {
        project: {
            key: component.key || '',
            name: component.name || component.key || 'Proyecto SonarQube',
        },
        generatedAt,
        source: 'SonarQube, Jest y LCOV',
        qualityGate: {
            status: normalizeGateStatus(gate.status),
            conditions: (gate.conditions || []).map(normalizeCondition),
        },
        metrics: {
            linesOfCode: toNumber(values.ncloc),
            tests: toNumber(values.tests),
            testFailures: toNumber(values.test_failures),
            testErrors: toNumber(values.test_errors),
            testSuccessRate: toNumber(values.test_success_density),
            coverage: toNumber(values.coverage),
            lineCoverage: toNumber(values.line_coverage),
            branchCoverage: toNumber(values.branch_coverage),
            duplication: toNumber(values.duplicated_lines_density),
            duplicatedLines: toNumber(values.duplicated_lines),
            securityIssues: toNumber(values.software_quality_security_issues),
            vulnerabilities: toNumber(values.vulnerabilities),
            securityRating: toRating(values.security_rating),
            reliabilityIssues: toNumber(values.software_quality_reliability_issues),
            bugs: toNumber(values.bugs),
            reliabilityRating: toRating(values.reliability_rating),
            maintainabilityIssues: toNumber(values.software_quality_maintainability_issues),
            codeSmells: toNumber(values.code_smells),
            maintainabilityRating: toRating(values.sqale_rating),
            securityHotspots: toNumber(values.security_hotspots),
            securityReviewRating: toRating(values.security_review_rating),
        },
        links: {
            dashboard: `${publicUrl}/dashboard?id=${encodeURIComponent(component.key || '')}`,
        },
    };
};

module.exports = {
    mapDashboard,
    normalizeGateStatus,
    toNumber,
    toRating,
};
