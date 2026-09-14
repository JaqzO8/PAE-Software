import { useEffect, useMemo, useState } from "react";
import { Bell, CalendarDays, CheckCircle2, Clock, Play, Save } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Skeleton,
} from "../../desingSystem/primitives";
import { useToast } from "../../hooks/useToast";
import {
  generateStudyReminders,
  getPlanningOverview,
  updateReminderStatus,
  updateStudyPreference,
  type PlanningOverview,
  type StudyPreference,
} from "../../features/planning/services/planningService";

const dayOptions = [
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mie" },
  { value: 4, label: "Jue" },
  { value: 5, label: "Vie" },
  { value: 6, label: "Sab" },
  { value: 0, label: "Dom" },
];

const formatDateTime = (value: string) => new Intl.DateTimeFormat("es-PE", {
  dateStyle: "medium",
  timeStyle: "short",
}).format(new Date(value));

const Planning = () => {
  const { toast } = useToast();
  const [overview, setOverview] = useState<PlanningOverview | null>(null);
  const [preference, setPreference] = useState<StudyPreference | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);

  const subjectsText = useMemo(() => preference?.subjects.join(", ") || "", [preference?.subjects]);

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      const data = await getPlanningOverview();
      setOverview(data);
      setPreference(data.preference);
      setPomodoroSeconds(data.settings.pomodoroFocusMinutes * 60);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo cargar la planificacion",
        description: "Intenta nuevamente en unos segundos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    if (!isPomodoroRunning || pomodoroSeconds <= 0) return undefined;
    const interval = window.setInterval(() => setPomodoroSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(interval);
  }, [isPomodoroRunning, pomodoroSeconds]);

  const toggleDay = (day: number) => {
    setPreference((current) => {
      if (!current) return current;
      const exists = current.preferredDays.includes(day);
      return {
        ...current,
        preferredDays: exists
          ? current.preferredDays.filter((item) => item !== day)
          : [...current.preferredDays, day].sort((a, b) => a - b),
      };
    });
  };

  const savePreference = async () => {
    if (!preference) return;
    const saved = await updateStudyPreference(preference);
    setPreference(saved);
    toast({ title: "Preferencias guardadas" });
    await loadOverview();
  };

  const createReminders = async () => {
    const reminders = await generateStudyReminders();
    toast({ title: "Recordatorios generados", description: `${reminders.length} sesiones quedaron programadas.` });
    await loadOverview();
  };

  const completeReminder = async (id: number) => {
    await updateReminderStatus(id, "completado");
    await loadOverview();
  };

  const pomodoroLabel = `${Math.floor(pomodoroSeconds / 60).toString().padStart(2, "0")}:${(pomodoroSeconds % 60).toString().padStart(2, "0")}`;

  if (isLoading || !overview || !preference) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-contrast">Planificacion</h1>
        <p className="text-muted-foreground">Organiza horarios, recordatorios y sesiones pomodoro.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Preferencias de estudio</CardTitle>
            <Button type="button" variant="brand" onClick={savePreference}>
              <Save className="h-4 w-4" />
              Guardar
            </Button>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary-contrast">Dias preferidos</p>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((day) => (
                  <Button
                    key={day.value}
                    type="button"
                    size="sm"
                    variant={preference.preferredDays.includes(day.value) ? "brand" : "outline"}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-2 text-sm font-medium">
                Desde
                <Input type="time" value={preference.startTime} onChange={(event) => setPreference({ ...preference, startTime: event.target.value })} />
              </label>
              <label className="space-y-2 text-sm font-medium">
                Hasta
                <Input type="time" value={preference.endTime} onChange={(event) => setPreference({ ...preference, endTime: event.target.value })} />
              </label>
            </div>
            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Materias
              <Input
                value={subjectsText}
                onChange={(event) => setPreference({
                  ...preference,
                  subjects: event.target.value.split(",").map((item) => item.trim()).filter(Boolean),
                })}
              />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={preference.remindersEnabled}
                onCheckedChange={(checked) => setPreference({ ...preference, remindersEnabled: Boolean(checked) })}
              />
              Recordatorios activos
            </label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-brand-action" />
              Pomodoro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border bg-neutral-50 p-6 text-center">
              <p className="text-4xl font-bold text-primary-contrast">{pomodoroLabel}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Enfoque {overview.settings.pomodoroFocusMinutes} min | Descanso {overview.settings.pomodoroBreakMinutes} min
              </p>
            </div>
            <Button type="button" className="w-full" variant="brand" onClick={() => setIsPomodoroRunning((value) => !value)}>
              <Play className="h-4 w-4" />
              {isPomodoroRunning ? "Pausar" : "Iniciar"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-brand-action" />
            Horarios sugeridos
          </CardTitle>
          <Button type="button" variant="outline" onClick={createReminders}>
            <Bell className="h-4 w-4" />
            Crear recordatorios
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {overview.suggestions.map((suggestion) => (
            <div key={`${suggestion.subject}-${suggestion.scheduledAt}`} className="rounded-md border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary-contrast">{suggestion.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{formatDateTime(suggestion.scheduledAt)}</p>
                </div>
                <Badge variant="outline">{suggestion.durationMinutes} min</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recordatorios activos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {overview.reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay recordatorios programados.</p>
          ) : overview.reminders.map((reminder) => (
            <div key={reminder.id_recordatorio} className="flex flex-col gap-3 rounded-md border bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold text-primary-contrast">{reminder.titulo}</p>
                <p className="text-sm text-muted-foreground">{formatDateTime(reminder.programado_para)}</p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => completeReminder(reminder.id_recordatorio)}>
                <CheckCircle2 className="h-4 w-4" />
                Completar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Planning;
