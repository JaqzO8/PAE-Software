import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, test, expect, vi } from 'vitest';
import QualityPage from '../src/pages/teacher/QualityDashboard';
import type { QualityDashboard } from '../src/features/quality/types/quality';
const state = vi.hoisted(() => ({ dashboard: null as QualityDashboard | null, isLoading: false, isRefreshing: false, error: null as string | null, refresh: vi.fn() }));
vi.mock('../src/features/quality/hooks/useQualityDashboard', () => ({ useQualityDashboard: () => state }));
let root: Root, container: HTMLDivElement;
const dashboard = (): QualityDashboard => ({ project: { key: 'qa-project', name: 'Proyecto QA' }, generatedAt: '2026-01-01T12:00:00Z', source: 'SonarQube',
    qualityGate: { status: 'passed', conditions: [{ metric: 'coverage', comparator: 'LT', threshold: 80, actual: 85, status: 'passed' }] },
    metrics: { linesOfCode: 1000, tests: 64, testFailures: 0, testErrors: 0, testSuccessRate: 100, coverage: 85, lineCoverage: 90, branchCoverage: 80,
        duplication: 2, duplicatedLines: 20, securityIssues: 0, vulnerabilities: 0, securityRating: 'A', reliabilityIssues: 0, bugs: 0, reliabilityRating: 'A',
        maintainabilityIssues: 0, codeSmells: 0, maintainabilityRating: 'A', securityHotspots: 0, securityReviewRating: 'A' },
    links: { dashboard: 'https://sonarcloud.io/summary/overall?id=qa-project' },
});
beforeEach(() => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    Object.assign(state, { dashboard: dashboard(), isLoading: false, isRefreshing: false, error: null }); state.refresh.mockReset();
    container = document.createElement('div'); document.body.append(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); });
const render = () => act(async () => root.render(<QualityPage />));
test('loading does not claim a successful gate before evidence arrives', async () => {
    state.isLoading = true; await render(); expect(container.querySelector('[aria-label="Cargando métricas de calidad"]')).not.toBeNull();
    expect(container.textContent).not.toContain('Passed');
});
test('unavailable metrics expose the service error and allow retry', async () => {
    state.dashboard = null; state.error = 'Sonar no disponible'; await render();
    expect(container.textContent).toContain('Métricas no disponibles'); expect(container.textContent).toContain('Sonar no disponible');
    await act(async () => container.querySelector('button')!.click()); expect(state.refresh).toHaveBeenCalledTimes(1);
});
test('successful analysis renders real totals, percentages, threshold direction and project link', async () => {
    await render();
    for (const value of ['Proyecto QA', 'Quality Gate: Passed', '64 aprobadas, 0 con fallo o error', '85.0%', 'Cobertura general', '≥ 80']) expect(container.textContent).toContain(value);
    expect(container.querySelector('a')?.href).toBe(state.dashboard!.links.dashboard);
    expect(container.querySelector('a')?.rel).toContain('noreferrer');
    await act(async () => container.querySelector('button')!.click()); expect(state.refresh).toHaveBeenCalledTimes(1);
});
test.each(['B', 'C', 'D', 'E'])('failed analysis and security rating %s are visibly failing, even with cached metrics', async rating => {
    const d = state.dashboard!; d.qualityGate.status = 'failed';
    d.qualityGate.conditions = [{ metric: 'custom_metric', comparator: 'GT', threshold: 3, actual: 8, status: 'failed' }];
    Object.assign(d.metrics, { tests: 1, testFailures: 2, testErrors: 1, coverage: 25, duplication: 8, testSuccessRate: 50, securityRating: rating,
        reliabilityRating: 'C', maintainabilityRating: 'D', securityHotspots: 1 });
    state.error = 'No se pudo actualizar'; state.isRefreshing = true; await render();
    for (const value of ['Quality Gate: Failed', '0 aprobadas, 3 con fallo o error', 'No cumple', 'custom_metric', '≤ 3', `Seguridad ${rating}`, state.error]) expect(container.textContent).toContain(value);
    expect(container.querySelector('button')!.disabled).toBe(true);
});
test('unknown gate is not presented as passed', async () => {
    state.dashboard!.qualityGate = { status: 'unknown', conditions: [] }; await render();
    expect(container.textContent).toContain('Quality Gate: Sin estado'); expect(container.textContent).toContain('0 condiciones evaluadas');
});
