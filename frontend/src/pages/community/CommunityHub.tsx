import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BriefcaseBusiness,
  HeartPulse,
  Loader2,
  Newspaper,
  Save,
  TimerReset,
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
  communityService,
  type CommunityHub,
  type CommunitySettings,
  type WellbeingItem,
} from "../../features/community/services/communityService";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";

const formatDate = (date?: string) => {
  if (!date) return "";
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const settingsFields: Array<{
  key: keyof Omit<CommunitySettings, "performanceWeights">;
  label: string;
  min: number;
  max: number;
}> = [
  { key: "restSessionMinutes", label: "Descanso sugerido", min: 3, max: 30 },
  { key: "performanceWindowDays", label: "Ventana de analitica", min: 7, max: 120 },
  { key: "activeParticipationTargetPercent", label: "Meta participacion", min: 30, max: 100 },
  { key: "lowParticipationThreshold", label: "Umbral de riesgo", min: 10, max: 80 },
  { key: "messageTargetPerMember", label: "Mensajes por miembro", min: 1, max: 20 },
  { key: "resourceTargetPerCommunity", label: "Recursos por comunidad", min: 1, max: 30 },
  { key: "challengeTargetPerMonth", label: "Desafios por ventana", min: 1, max: 12 },
  { key: "universityNewsLimit", label: "Noticias visibles", min: 3, max: 20 },
];

const contentIcons = {
  descanso: TimerReset,
  orientacion: BriefcaseBusiness,
  bienestar: HeartPulse,
};

const contentLabels = {
  descanso: "Zona de descanso",
  orientacion: "Orientacion vocacional",
  bienestar: "Bienestar academico",
};

function ContentList({ items, type }: { items: WellbeingItem[]; type: keyof typeof contentLabels }) {
  const Icon = contentIcons[type];

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-600">
        No hay contenidos activos para esta categoria.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <Card key={item.id} className="border-neutral-200 shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-action/10 text-brand-action">
                <Icon className="h-5 w-5" />
              </span>
              {item.durationMinutes ? (
                <Badge variant="outline">{item.durationMinutes} min</Badge>
              ) : null}
            </div>
            <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-neutral-600">{item.description}</p>
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-neutral-100 text-neutral-700">
                  {tag}
                </Badge>
              ))}
            </div>
            <Button
              variant="outline"
              className="w-full"
              disabled={!item.url}
              onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
            >
              {item.actionLabel || "Abrir"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function CommunityHubPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [hub, setHub] = useState<CommunityHub | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<CommunitySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isTeacher = user?.rol === "docente";
  const totalGuides = useMemo(() => {
    if (!hub) return 0;
    return hub.contents.descanso.length + hub.contents.orientacion.length + hub.contents.bienestar.length;
  }, [hub]);

  useEffect(() => {
    loadHub();
  }, []);

  const loadHub = async () => {
    setIsLoading(true);
    try {
      const data = await communityService.getHub();
      setHub(data);
      setSettingsDraft(data.settings);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo cargar comunidad",
        description: "Intenta nuevamente en unos segundos.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateDraftNumber = (key: keyof Omit<CommunitySettings, "performanceWeights">, value: string) => {
    if (!settingsDraft) return;
    setSettingsDraft({ ...settingsDraft, [key]: Number(value) });
  };

  const saveSettings = async () => {
    if (!settingsDraft) return;
    setIsSaving(true);
    try {
      const settings = await communityService.updateSettings(settingsDraft);
      setHub((current) => current ? { ...current, settings } : current);
      setSettingsDraft(settings);
      toast({ title: "Parametros actualizados", description: "Las comunidades usaran estas reglas." });
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

  if (isLoading || !hub || !settingsDraft) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-52 w-full rounded-lg" />
        <Skeleton className="h-80 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-primary-contrast">Bienestar y comunidad</h1>
          <p className="max-w-3xl text-sm leading-6 text-neutral-600">
            Espacio de descanso, orientacion vocacional, noticias universitarias y reglas de colaboracion para comunidades PAE.
          </p>
        </div>
        <Button variant="brand" onClick={loadHub}>
          <Activity className="h-4 w-4" />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-neutral-200">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-brand-action/10 text-brand-action">
              <HeartPulse className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-primary-contrast">{totalGuides}</p>
              <p className="text-sm text-neutral-600">Guias activas</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-success-progress/10 text-success-progress">
              <TimerReset className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-primary-contrast">{hub.summary.restSessionMinutes} min</p>
              <p className="text-sm text-neutral-600">Descanso recomendado</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardContent className="flex items-center gap-4 p-5">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Newspaper className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold text-primary-contrast">{hub.news.length}</p>
              <p className="text-sm text-neutral-600">Noticias disponibles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="descanso" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start bg-white">
          <TabsTrigger value="descanso">Descanso</TabsTrigger>
          <TabsTrigger value="orientacion">Orientacion</TabsTrigger>
          <TabsTrigger value="bienestar">Bienestar</TabsTrigger>
          <TabsTrigger value="noticias">Noticias</TabsTrigger>
          {isTeacher ? <TabsTrigger value="parametros">Parametros</TabsTrigger> : null}
        </TabsList>

        <TabsContent value="descanso" className="m-0">
          <ContentList type="descanso" items={hub.contents.descanso} />
        </TabsContent>
        <TabsContent value="orientacion" className="m-0">
          <ContentList type="orientacion" items={hub.contents.orientacion} />
        </TabsContent>
        <TabsContent value="bienestar" className="m-0">
          <ContentList type="bienestar" items={hub.contents.bienestar} />
        </TabsContent>
        <TabsContent value="noticias" className="m-0">
          <div className="grid gap-4 md:grid-cols-2">
            {hub.news.map((item) => (
              <Card key={item.id} className="border-neutral-200 shadow-sm">
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-neutral-100 text-neutral-700">
                      {item.university}
                    </Badge>
                    <Badge variant="outline">{item.category}</Badge>
                  </div>
                  <CardTitle className="text-base leading-snug">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm leading-6 text-neutral-600">{item.summary}</p>
                  <div className="flex items-center justify-between gap-3 text-xs text-neutral-500">
                    <span>{formatDate(item.publishedAt)}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!item.url}
                      onClick={() => item.url && window.open(item.url, "_blank", "noopener,noreferrer")}
                    >
                      Abrir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        {isTeacher ? (
          <TabsContent value="parametros" className="m-0">
            <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-5">
              <div>
                <h2 className="text-lg font-semibold text-primary-contrast">Reglas comunitarias</h2>
                <p className="text-sm text-neutral-600">
                  Estos valores ajustan recomendaciones, noticias visibles y perfil de rendimiento.
                </p>
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
                      value={settingsDraft[field.key]}
                      onChange={(event) => updateDraftNumber(field.key, event.target.value)}
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
