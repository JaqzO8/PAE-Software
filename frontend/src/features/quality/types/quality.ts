export type QualityGateStatus = "passed" | "failed" | "unknown";

export interface QualityGateCondition {
  metric: string;
  status: "passed" | "failed";
  comparator: "LT" | "GT" | string;
  threshold: number;
  actual: number;
}

export interface QualityMetrics {
  linesOfCode: number;
  tests: number;
  testFailures: number;
  testErrors: number;
  testSuccessRate: number;
  coverage: number;
  lineCoverage: number;
  branchCoverage: number;
  duplication: number;
  duplicatedLines: number;
  securityIssues: number;
  vulnerabilities: number;
  securityRating: string;
  reliabilityIssues: number;
  bugs: number;
  reliabilityRating: string;
  maintainabilityIssues: number;
  codeSmells: number;
  maintainabilityRating: string;
  securityHotspots: number;
  securityReviewRating: string;
}

export interface QualityDashboard {
  project: {
    key: string;
    name: string;
  };
  generatedAt: string;
  source: string;
  qualityGate: {
    status: QualityGateStatus;
    conditions: QualityGateCondition[];
  };
  metrics: QualityMetrics;
  links: {
    dashboard: string;
  };
}

export interface QualityDashboardResponse {
  success: boolean;
  cached: boolean;
  dashboard: QualityDashboard;
}
