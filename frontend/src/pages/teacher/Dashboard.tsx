// src/pages/teacher/Dashboard.tsx
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Skeleton,
} from "../../desingSystem/primitives";
import { useEffect, useState } from "react";
import { AlertTriangle, BarChart3, Save, Users, FileText, TrendingUp, TrendingDown, Target } from "lucide-react";
import { useTeacherStats } from "../../features/dashboard/hooks/useTeacherStats";
import {
  updateAnalyticsSettings,
  updateStudySettings,
  type AnalyticsSettings,
  type StudySettings,
} from "../../features/dashboard/services/teacherStatsService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

const TeacherDashboard = () => {
  const { stats, isLoading, refreshStats } = useTeacherStats();
  const { user } = useAuth();
  const { toast } = useToast();
  const [settingsDraft, setSettingsDraft] = useState<AnalyticsSettings | null>(null);
  const [studySettingsDraft, setStudySettingsDraft] = useState<StudySettings | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isSavingStudySettings, setIsSavingStudySettings] = useState(false);
  const firstName = user?.nombres?.split(" ")[0] || "Profesor";

  useEffect(() => {
    if (stats?.settings) {
      setSettingsDraft(stats.settings);
    }
  }, [stats?.settings]);

  useEffect(() => {
    if (stats?.studySettings) {
      setStudySettingsDraft(stats.studySettings);
    }
  }, [stats?.studySettings]);

  const updateDraftNumber = (field: keyof AnalyticsSettings, value: string) => {
    setSettingsDraft((current) => {
      if (!current) return current;
      return { ...current, [field]: Number(value) };
    });
  };

  const updateStudyDraftNumber = (field: keyof StudySettings, value: string) => {
    setStudySettingsDraft((current) => {
      if (!current) return current;
      return { ...current, [field]: Number(value) };
    });
  };

  const saveSettings = async () => {
    if (!settingsDraft) return;

    setIsSavingSettings(true);
    try {
      const updated = await updateAnalyticsSettings(settingsDraft);
      setSettingsDraft(updated);
      await refreshStats();
      toast({
        title: "Configuracion actualizada",
        description: "Las reglas de analitica se aplicaron correctamente.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo guardar",
        description: "Revisa los valores e intenta nuevamente.",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const saveStudySettings = async () => {
    if (!studySettingsDraft) return;

    setIsSavingStudySettings(true);
    try {
      const updated = await updateStudySettings(studySettingsDraft);
      setStudySettingsDraft(updated);
      await refreshStats();
      toast({
        title: "Habitos actualizados",
        description: "Las reglas de ritmo de estudio se aplicaron correctamente.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo guardar",
        description: "Revisa los valores e intenta nuevamente.",
      });
    } finally {
      setIsSavingStudySettings(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="px-4 md:px-0">
        <h1 className="text-2xl md:text-3xl font-bold text-primary-contrast">
          Hola, {firstName}
        </h1>
        <p className="text-sm md:text-base text-muted-foreground">
          Aqui tienes el resumen de actividad y rendimiento de tus estudiantes.
        </p>
      </div>

      <div className="grid gap-4 px-4 md:px-0 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estudiantes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.activeStudents || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  {stats && stats.studentGrowth > 0 ? (
                    <>
                      <TrendingUp className="h-3 w-3 text-success-progress" />
                      <span className="text-success-progress">+{stats.studentGrowth}%</span>
                    </>
                  ) : stats && stats.studentGrowth < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-500" />
                      <span className="text-red-500">{stats.studentGrowth}%</span>
                    </>
                  ) : (
                    <span className="text-neutral-500">Sin cambios</span>
                  )}
                  vs mes anterior
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mis Repositorios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalRepositories || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Contenido publicado</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Calificar</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.pendingEvaluations || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Evaluaciones pendientes</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Precision Promedio</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.averageAccuracy || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">{stats?.simulacroAttempts || 0} simulacros</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mx-4 md:mx-0">
        <CardHeader>
          <CardTitle>Analisis de simulacros</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-md border bg-neutral-50 p-4">
                <p className="text-sm text-muted-foreground">Intentos registrados</p>
                <p className="mt-1 text-2xl font-bold">{stats?.simulacroAttempts || 0}</p>
              </div>
              <div className="rounded-md border bg-neutral-50 p-4">
                <p className="text-sm text-muted-foreground">Abiertas pendientes</p>
                <p className="mt-1 text-2xl font-bold">{stats?.pendingOpenReviews || 0}</p>
              </div>
              <div className="rounded-md border bg-amber-50 p-4 text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-semibold">Alertas</p>
                </div>
                <p className="mt-1 text-2xl font-bold">{stats?.lowPerformanceAlerts || 0}</p>
                <p className="mt-1 text-xs">Estudiantes bajo 60%</p>
              </div>
              <div className="rounded-md border bg-blue-50 p-4 text-blue-900">
                <p className="text-sm font-semibold">Tema a reforzar</p>
                <p className="mt-1 text-lg font-bold">{stats?.weakSubject || "Sin datos suficientes"}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mx-4 md:mx-0">
        <CardHeader>
          <CardTitle>Ritmo de lecciones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-md border bg-neutral-50 p-4">
                <p className="text-sm text-muted-foreground">Lecciones completadas</p>
                <p className="mt-1 text-2xl font-bold">{stats?.lessonStudy.completedLessons || 0}</p>
              </div>
              <div className="rounded-md border bg-neutral-50 p-4">
                <p className="text-sm text-muted-foreground">Promedio por leccion</p>
                <p className="mt-1 text-2xl font-bold">{stats?.lessonStudy.averageLessonMinutes || 0} min</p>
              </div>
              <div className="rounded-md border bg-amber-50 p-4 text-amber-900">
                <p className="text-sm font-semibold">Sesiones largas</p>
                <p className="mt-1 text-2xl font-bold">{stats?.lessonStudy.longSessions || 0}</p>
              </div>
              <div className="rounded-md border bg-blue-50 p-4 text-blue-900">
                <p className="text-sm font-semibold">Cierres rapidos</p>
                <p className="mt-1 text-2xl font-bold">{stats?.lessonStudy.fastCompletions || 0}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mx-4 md:mx-0">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Reglas de seguimiento</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="brand"
            onClick={saveSettings}
            disabled={!settingsDraft || isSavingSettings}
          >
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading || !settingsDraft ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 text-sm font-medium text-primary-contrast">
                Bajo rendimiento (%)
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settingsDraft.lowPerformanceThreshold}
                  onChange={(event) => updateDraftNumber("lowPerformanceThreshold", event.target.value)}
                  className="h-10 rounded-md"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary-contrast">
                Rendimiento critico (%)
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settingsDraft.criticalPerformanceThreshold}
                  onChange={(event) => updateDraftNumber("criticalPerformanceThreshold", event.target.value)}
                  className="h-10 rounded-md"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary-contrast">
                Intentos para alerta
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={settingsDraft.minAttemptsForAlert}
                  onChange={(event) => updateDraftNumber("minAttemptsForAlert", event.target.value)}
                  className="h-10 rounded-md"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary-contrast">
                Precision objetivo (%)
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={settingsDraft.targetAccuracy}
                  onChange={(event) => updateDraftNumber("targetAccuracy", event.target.value)}
                  className="h-10 rounded-md"
                />
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mx-4 md:mx-0">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Reglas de habitos de estudio</CardTitle>
          <Button
            type="button"
            size="sm"
            variant="brand"
            onClick={saveStudySettings}
            disabled={!studySettingsDraft || isSavingStudySettings}
          >
            <Save className="h-4 w-4" />
            Guardar
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading || !studySettingsDraft ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 text-sm font-medium text-primary-contrast">
                Descanso cada (min)
                <Input
                  type="number"
                  min={5}
                  max={120}
                  value={studySettingsDraft.restReminderMinutes}
                  onChange={(event) => updateStudyDraftNumber("restReminderMinutes", event.target.value)}
                  className="h-10 rounded-md"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary-contrast">
                Factor sesion larga
                <Input
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  value={studySettingsDraft.longTimeMultiplier}
                  onChange={(event) => updateStudyDraftNumber("longTimeMultiplier", event.target.value)}
                  className="h-10 rounded-md"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary-contrast">
                Factor cierre rapido
                <Input
                  type="number"
                  min={0.1}
                  max={1}
                  step={0.1}
                  value={studySettingsDraft.fastTimeMultiplier}
                  onChange={(event) => updateStudyDraftNumber("fastTimeMultiplier", event.target.value)}
                  className="h-10 rounded-md"
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-primary-contrast">
                Minimo seguimiento (seg)
                <Input
                  type="number"
                  min={10}
                  max={600}
                  value={studySettingsDraft.minTrackedSeconds}
                  onChange={(event) => updateStudyDraftNumber("minTrackedSeconds", event.target.value)}
                  className="h-10 rounded-md"
                />
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mx-4 md:mx-0">
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {stats?.activeStudents || 0} estudiantes con actividad evaluable
                </p>
                <p className="text-xs text-muted-foreground">Basado en simulacros finalizados</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {stats?.totalRepositories || 0} repositorios disponibles
                </p>
                <p className="text-xs text-muted-foreground">Contenido para reforzar el aprendizaje</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-neutral-50 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  Cohorte: {stats?.performanceDistribution.low || 0} bajo, {stats?.performanceDistribution.medium || 0} medio, {stats?.performanceDistribution.high || 0} alto
                </p>
                <p className="text-xs text-muted-foreground">
                  Promedio general de precision: {stats?.cohortAverageAccuracy || 0}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherDashboard;
