import {
  Activity,
  AlertTriangle,
  Bug,
  CheckCircle2,
  CircleGauge,
  Copy,
  ExternalLink,
  FileCode2,
  FlaskConical,
  RefreshCw,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button, Skeleton } from "../../desingSystem/primitives";
import { useQualityDashboard } from "../../features/quality/hooks/useQualityDashboard";
import type {
  QualityGateCondition,
  QualityGateStatus,
} from "../../features/quality/types/quality";

const numberFormatter = new Intl.NumberFormat("es-PE");
const dateFormatter = new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
});

const conditionLabels: Record<string, string> = {
  coverage: "Cobertura general",
  new_coverage: "Cobertura en código nuevo",
  duplicated_lines_density: "Duplicación general",
  new_duplicated_lines_density: "Duplicación en código nuevo",
  new_violations: "Incidencias nuevas",
  software_quality_security_rating: "Rating de seguridad",
  test_success_density: "Éxito de pruebas",
};

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const getGatePresentation = (status: QualityGateStatus) => {
  if (status === "passed") {
    return {
      label: "Passed",
      detail: "Todas las condiciones del Quality Gate están aprobadas.",
      className: "border-emerald-200 bg-emerald-50 text-emerald-900",
      icon: CheckCircle2,
    };
  }

  if (status === "failed") {
    return {
      label: "Failed",
      detail: "Una o más condiciones requieren corrección.",
      className: "border-red-200 bg-red-50 text-red-900",
      icon: AlertTriangle,
    };
  }

  return {
    label: "Sin estado",
    detail: "SonarQube todavía no publicó un resultado concluyente.",
    className: "border-amber-200 bg-amber-50 text-amber-900",
    icon: AlertTriangle,
  };
};

const getRatingClass = (rating: string) => {
  if (rating === "A") return "bg-emerald-100 text-emerald-800";
  if (rating === "B") return "bg-lime-100 text-lime-800";
  if (rating === "C") return "bg-amber-100 text-amber-800";
  if (rating === "D") return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
};

const formatConditionTarget = (condition: QualityGateCondition) => {
  const operator = condition.comparator === "GT" ? "≤" : "≥";
  return `${operator} ${condition.threshold}`;
};

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone: "blue" | "green" | "amber" | "red" | "slate";
}

const toneClasses: Record<MetricCardProps["tone"], string> = {
  blue: "border-l-sky-500 bg-sky-50/40 text-sky-700",
  green: "border-l-emerald-500 bg-emerald-50/40 text-emerald-700",
  amber: "border-l-amber-500 bg-amber-50/40 text-amber-800",
  red: "border-l-red-500 bg-red-50/40 text-red-700",
  slate: "border-l-neutral-500 bg-white text-neutral-700",
};

const MetricCard = ({ label, value, detail, icon: Icon, tone }: MetricCardProps) => (
  <article className={`min-h-36 border border-neutral-200 border-l-4 p-4 shadow-sm ${toneClasses[tone]}`}>
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs font-semibold uppercase text-neutral-500">{label}</p>
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
    </div>
    <p className="mt-3 text-3xl font-bold text-primary-contrast">{value}</p>
    <p className="mt-2 text-sm text-neutral-600">{detail}</p>
  </article>
);

const DashboardSkeleton = () => (
  <div className="space-y-6" aria-label="Cargando métricas de calidad">
    <Skeleton className="h-28 w-full rounded-lg" />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }, (_, index) => `quality-skeleton-${index + 1}`).map((id) => (
        <Skeleton key={id} className="h-36 w-full rounded-lg" />
      ))}
    </div>
  </div>
);

const QualityDashboardPage = () => {
  const { dashboard, isLoading, isRefreshing, error, refresh } = useQualityDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (!dashboard) {
    return (
      <div className="flex min-h-[55vh] flex-col items-center justify-center gap-4 text-center">
        <AlertTriangle className="h-10 w-10 text-amber-600" aria-hidden="true" />
        <div>
          <h1 className="text-xl font-semibold text-primary-contrast">Métricas no disponibles</h1>
          <p className="mt-1 text-sm text-neutral-600">{error}</p>
        </div>
        <Button onClick={refresh} disabled={isRefreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Reintentar
        </Button>
      </div>
    );
  }

  const { metrics, project, qualityGate } = dashboard;
  const gate = getGatePresentation(qualityGate.status);
  const GateIcon = gate.icon;
  const failedTests = metrics.testFailures + metrics.testErrors;
  const approvedTests = Math.max(metrics.tests - failedTests, 0);

  const cards: MetricCardProps[] = [
    {
      label: "Pruebas ejecutadas",
      value: numberFormatter.format(metrics.tests),
      detail: `${approvedTests} aprobadas, ${failedTests} con fallo o error`,
      icon: FlaskConical,
      tone: failedTests === 0 ? "green" : "red",
    },
    {
      label: "Tasa de aprobación",
      value: formatPercent(metrics.testSuccessRate),
      detail: "Resultados importados desde Jest",
      icon: CheckCircle2,
      tone: metrics.testSuccessRate >= 100 ? "green" : "amber",
    },
    {
      label: "Cobertura",
      value: formatPercent(metrics.coverage),
      detail: `${formatPercent(metrics.lineCoverage)} líneas · ${formatPercent(metrics.branchCoverage)} condiciones`,
      icon: CircleGauge,
      tone: metrics.coverage >= 80 ? "blue" : "red",
    },
    {
      label: "Duplicación",
      value: formatPercent(metrics.duplication),
      detail: `${numberFormatter.format(metrics.duplicatedLines)} líneas duplicadas`,
      icon: Copy,
      tone: metrics.duplication <= 5 ? "green" : "red",
    },
    {
      label: "Seguridad",
      value: metrics.securityRating,
      detail: `${metrics.securityIssues} incidencias · ${metrics.vulnerabilities} vulnerabilidades`,
      icon: ShieldCheck,
      tone: metrics.securityRating === "A" ? "green" : "red",
    },
    {
      label: "Confiabilidad",
      value: metrics.reliabilityRating,
      detail: `${metrics.reliabilityIssues} incidencias · ${metrics.bugs} bugs`,
      icon: Bug,
      tone: metrics.reliabilityRating === "A" ? "green" : "amber",
    },
    {
      label: "Mantenibilidad",
      value: metrics.maintainabilityRating,
      detail: `${metrics.maintainabilityIssues} incidencias · ${metrics.codeSmells} code smells`,
      icon: Wrench,
      tone: metrics.maintainabilityRating === "A" ? "green" : "amber",
    },
    {
      label: "Security Hotspots",
      value: numberFormatter.format(metrics.securityHotspots),
      detail: `Rating de revisión ${metrics.securityReviewRating}`,
      icon: Activity,
      tone: metrics.securityHotspots === 0 ? "green" : "amber",
    },
  ];

  return (
    <div className="space-y-8">
      <header className="border-b border-neutral-200 pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-action">Calidad del software</p>
            <h1 className="mt-1 text-3xl font-bold text-primary-contrast">{project.name}</h1>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600">
              <span><strong className="text-neutral-800">Proyecto:</strong> {project.key}</span>
              <span><strong className="text-neutral-800">Fuente:</strong> {dashboard.source}</span>
              <span><strong className="text-neutral-800">Código:</strong> {numberFormatter.format(metrics.linesOfCode)} líneas</span>
              <span><strong className="text-neutral-800">Sincronizado:</strong> {dateFormatter.format(new Date(dashboard.generatedAt))}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={refresh} disabled={isRefreshing} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
            <Button asChild className="gap-2">
              <a href={dashboard.links.dashboard} target="_blank" rel="noreferrer">
                Abrir SonarQube
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </header>

      <section className={`flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between ${gate.className}`}>
        <div className="flex items-center gap-3">
          <GateIcon className="h-7 w-7 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold">Quality Gate: {gate.label}</h2>
            <p className="text-sm opacity-80">{gate.detail}</p>
          </div>
        </div>
        <span className="text-sm font-semibold">{qualityGate.conditions.length} condiciones evaluadas</span>
      </section>

      <section aria-labelledby="quality-kpis-title">
        <div className="mb-4 flex items-center gap-2">
          <FileCode2 className="h-5 w-5 text-brand-action" aria-hidden="true" />
          <h2 id="quality-kpis-title" className="text-xl font-semibold text-primary-contrast">Indicadores clave</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => <MetricCard key={card.label} {...card} />)}
        </div>
      </section>

      <section aria-labelledby="gate-conditions-title">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 id="gate-conditions-title" className="text-xl font-semibold text-primary-contrast">Condiciones del Quality Gate</h2>
          <span className={`rounded-full px-3 py-1 text-sm font-bold ${getRatingClass(metrics.securityRating)}`}>
            Seguridad {metrics.securityRating}
          </span>
        </div>
        <div className="overflow-x-auto border-y border-neutral-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-neutral-100 text-xs uppercase text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Condición</th>
                <th className="px-4 py-3 font-semibold">Valor actual</th>
                <th className="px-4 py-3 font-semibold">Objetivo</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {qualityGate.conditions.map((condition) => (
                <tr key={condition.metric}>
                  <td className="px-4 py-3 font-medium text-neutral-800">
                    {conditionLabels[condition.metric] || condition.metric}
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{condition.actual}</td>
                  <td className="px-4 py-3 text-neutral-700">{formatConditionTarget(condition)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 font-semibold ${condition.status === "passed" ? "text-emerald-700" : "text-red-700"}`}>
                      {condition.status === "passed" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                      {condition.status === "passed" ? "Cumple" : "No cumple"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default QualityDashboardPage;
