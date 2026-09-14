import { useEffect, useMemo, useState } from "react";
import {
  Award,
  CheckCircle2,
  Crown,
  Loader2,
  Medal,
  Save,
  Sparkles,
  Trophy,
} from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../desingSystem/primitives";
import {
  completeOnboardingStep,
  getGamificationLeaderboard,
  getGamificationSettings,
  getGamificationSummary,
  updateGamificationSettings,
  type GamificationLeaderboardItem,
  type GamificationSettings,
  type GamificationSummary,
} from "../../features/learning/services/learningService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

const settingsFields: Array<{
  key: keyof Omit<GamificationSettings, "onboardingSteps">;
  label: string;
  min: number;
  max: number;
  step?: number;
}> = [
  { key: "attemptCompletedPoints", label: "Puntos por simulacro", min: 0, max: 200 },
  { key: "highAccuracyBonusPoints", label: "Bono alta precision", min: 0, max: 300 },
  { key: "highAccuracyThreshold", label: "Umbral alta precision", min: 50, max: 100 },
  { key: "livePointsRatio", label: "Ratio puntos en vivo", min: 0, max: 1, step: 0.01 },
  { key: "onboardingStepPoints", label: "Puntos onboarding", min: 0, max: 100 },
  { key: "baseLevelPoints", label: "Base de nivel", min: 50, max: 1000 },
  { key: "levelPointsIncrement", label: "Incremento por nivel", min: 0, max: 500 },
  { key: "leaderboardLimit", label: "Limite ranking", min: 3, max: 50 },
];

const formatDate = (date?: string | null) => {
  if (!date) return "Sin actividad";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export default function GamificationPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<GamificationSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<GamificationLeaderboardItem[]>([]);
  const [settings, setSettings] = useState<GamificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [completingStep, setCompletingStep] = useState<string | null>(null);

  const isTeacher = user?.rol === "docente";
  const completedOnboarding = useMemo(() => {
    if (!summary?.onboarding.length) return 0;
    return Math.round((summary.onboarding.filter((step) => step.completed).length / summary.onboarding.length) * 100);
  }, [summary]);

  useEffect(() => {
    loadGamification();
  }, []);

  const loadGamification = async () => {
    setIsLoading(true);
    try {
      const [summaryData, leaderboardData] = await Promise.all([
        getGamificationSummary(),
        getGamificationLeaderboard(),
      ]);
      setSummary(summaryData);
      setLeaderboard(leaderboardData);

      if (isTeacher) {
        const settingsData = await getGamificationSettings();
        setSettings(settingsData);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo cargar gamificacion",
        description: "Revisa tu sesion e intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteStep = async (stepId: string) => {
    setCompletingStep(stepId);
    try {
      const nextSummary = await completeOnboardingStep(stepId);
      setSummary(nextSummary);
      toast({ title: "Paso completado", description: "Sumaste puntos de onboarding." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo completar",
        description: "Intenta nuevamente en unos segundos.",
      });
    } finally {
      setCompletingStep(null);
    }
  };

  const updateSetting = (key: keyof Omit<GamificationSettings, "onboardingSteps">, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: Number(value) });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const saved = await updateGamificationSettings(settings);
      setSettings(saved);
      toast({ title: "Reglas guardadas", description: "La gamificacion usara estos parametros." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se guardaron los parametros",
        description: "Verifica permisos o intenta nuevamente.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-56 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  const progress = summary.profile.levelProgress;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary-contrast">Gamificacion</h1>
          <p className="max-w-3xl text-sm leading-6 text-neutral-600">
            Sigue tu nivel, medallas, ranking y primeros pasos dentro de PAE.
          </p>
        </div>
        <Button variant="brand" onClick={loadGamification}>
          <Sparkles className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-neutral-200">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-action/10 text-brand-action">
              <Crown className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-primary-contrast">Nivel {summary.profile.level}</p>
              <p className="text-sm text-neutral-600">Progreso global</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Trophy className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-primary-contrast">{summary.profile.totalPoints}</p>
              <p className="text-sm text-neutral-600">Puntos acumulados</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-success-progress/10 text-success-progress">
              <Medal className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-primary-contrast">{summary.achievements.length}</p>
              <p className="text-sm text-neutral-600">Medallas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <CheckCircle2 className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-primary-contrast">{completedOnboarding}%</p>
              <p className="text-sm text-neutral-600">Onboarding</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-neutral-200">
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-semibold text-primary-contrast">
              Nivel {progress.level}: {summary.profile.totalPoints - progress.currentLevelStart} de {progress.nextLevelAt - progress.currentLevelStart} puntos
            </span>
            <span className="text-neutral-600">{progress.progressPercent}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-brand-action" style={{ width: `${progress.progressPercent}%` }} />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="onboarding" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start bg-white">
          <TabsTrigger value="onboarding">Onboarding</TabsTrigger>
          <TabsTrigger value="medallas">Medallas</TabsTrigger>
          <TabsTrigger value="ranking">Ranking</TabsTrigger>
          <TabsTrigger value="actividad">Actividad</TabsTrigger>
          {isTeacher ? <TabsTrigger value="parametros">Parametros</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="onboarding" className="m-0">
          <div className="grid gap-4 md:grid-cols-2">
            {summary.onboarding.map((step) => (
              <Card key={step.id} className="border-neutral-200">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-base">{step.title}</CardTitle>
                      <p className="mt-2 text-sm leading-6 text-neutral-600">{step.description}</p>
                    </div>
                    <Badge className={step.completed ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-700"}>
                      {step.completed ? "Hecho" : `+${step.points}`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    variant={step.completed ? "outline" : "brand"}
                    disabled={step.completed || completingStep === step.id}
                    onClick={() => handleCompleteStep(step.id)}
                  >
                    {completingStep === step.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {step.completed ? "Completado" : "Marcar como completado"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="medallas" className="m-0">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.achievements.length === 0 ? (
              <Card className="border-dashed p-8 text-center md:col-span-2 xl:col-span-3">
                <Award className="mx-auto h-10 w-10 text-neutral-300" />
                <p className="mt-3 font-semibold text-neutral-700">Aun no hay medallas</p>
                <p className="text-sm text-neutral-600">Completa simulacros y actividades para desbloquearlas.</p>
              </Card>
            ) : summary.achievements.map((achievement) => (
              <Card key={achievement.id} className="border-amber-200 bg-amber-50">
                <CardContent className="space-y-2 p-5">
                  <Medal className="h-6 w-6 text-amber-700" />
                  <p className="font-semibold text-primary-contrast">{achievement.title}</p>
                  <p className="text-sm leading-6 text-neutral-700">{achievement.description}</p>
                  <Badge className="bg-white text-amber-700">+{achievement.points} puntos</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ranking" className="m-0">
          <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
            {leaderboard.map((item) => (
              <div key={item.userId} className="grid grid-cols-[64px_1fr_110px_120px] items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0">
                <span className="text-lg font-bold text-primary-contrast">#{item.rank}</span>
                <div className="min-w-0">
                  <p className="truncate font-semibold text-primary-contrast">{item.displayName}</p>
                  <p className="text-xs text-neutral-500">{formatDate(item.lastActivity)}</p>
                </div>
                <span className="text-sm font-semibold text-brand-action">Nivel {item.level}</span>
                <span className="text-right text-sm text-neutral-700">{item.totalPoints} pts</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="actividad" className="m-0">
          <div className="space-y-3">
            {summary.recentEvents.map((event) => (
              <Card key={event.id} className="border-neutral-200">
                <CardContent className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-semibold text-primary-contrast">{event.description}</p>
                    <p className="text-xs text-neutral-500">{formatDate(event.createdAt)}</p>
                  </div>
                  <Badge variant="outline">+{event.points}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {isTeacher && settings ? (
          <TabsContent value="parametros" className="m-0">
            <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-semibold text-primary-contrast">Reglas de gamificacion</h2>
                <p className="text-sm text-neutral-600">Controla puntos, niveles, ranking y progreso inicial.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {settingsFields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input
                      id={field.key}
                      type="number"
                      min={field.min}
                      max={field.max}
                      step={field.step}
                      value={settings[field.key]}
                      onChange={(event) => updateSetting(field.key, event.target.value)}
                    />
                  </div>
                ))}
              </div>
              <Button variant="brand" onClick={saveSettings} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar parametros
              </Button>
            </div>
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}
