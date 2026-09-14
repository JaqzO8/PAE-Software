// src/pages/Profile.tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Camera,
  Check,
  Clock,
  Copy,
  Download,
  Globe2,
  LifeBuoy,
  LogOut,
  MailCheck,
  Monitor,
  Moon,
  Send,
  ShieldCheck,
  Sun,
  Type,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Skeleton,
  Checkbox,
  Separator,
} from "../desingSystem/primitives";
import { useProfile } from "../features/profile/hooks/useProfile";
import { useAuth } from "../context/AuthContext";
import { useAppearance } from "../context/AppearanceContext";
import { useToast } from "../hooks/useToast";
import {
  createSupportTicket,
  exportPrivacyData,
  listSupportTickets,
  requestAccountDeletion,
  type SupportTicket,
} from "../features/platform/services/platformService";
import { LOCALE_LABELS, SUPPORTED_LOCALES, type SupportedLocale } from "../config/i18nConfig";
import { profileSchema, passwordSchema, type ProfileFormData, type PasswordFormData } from "../features/profile/schemas";

const Profile = () => {
  const { user, stats, sessions, isLoading, isUpdating, updateProfile, updatePassword, logoutAllSessions } = useProfile();
  const { logout } = useAuth();
  const { preferences, updatePreferences, isSyncing } = useAppearance();
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isSupportLoading, setIsSupportLoading] = useState(false);
  const [supportForm, setSupportForm] = useState({
    subject: "",
    description: "",
    category: "tecnico" as SupportTicket["category"],
    priority: "media" as SupportTicket["priority"],
  });
  const [deletionReason, setDeletionReason] = useState("");

  // Form para edición de perfil
  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: user ? {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      institution: user.institution,
      bio: user.bio || "",
    } : undefined,
  });

  // Form para cambio de contraseña (sin currentPassword)
  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const handleCopyId = () => {
    if (user) {
      navigator.clipboard.writeText(user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const onProfileSubmit = (data: any) => {
    updateProfile(data as ProfileFormData);
  };

  const onPasswordSubmit = async (data: any) => {
    const result = await updatePassword(data as PasswordFormData);
    
    // Si el cambio fue exitoso, cerrar sesión y redirigir
    if (result) {
      passwordForm.reset();
      setTimeout(() => {
        logout();
      }, 1500);
    }
  };

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const tickets = await listSupportTickets();
        setSupportTickets(tickets);
      } catch (error) {
        console.warn("No se pudieron cargar los tickets de soporte.", error);
      }
    };

    loadTickets();
  }, []);

  const handleSupportSubmit = async () => {
    if (supportForm.subject.trim().length < 5 || supportForm.description.trim().length < 10) {
      toast({
        variant: "destructive",
        title: "Solicitud incompleta",
        description: "Agrega un asunto y una descripcion suficiente.",
      });
      return;
    }

    setIsSupportLoading(true);
    try {
      const ticket = await createSupportTicket(supportForm);
      setSupportTickets((current) => [ticket, ...current]);
      setSupportForm({ subject: "", description: "", category: "tecnico", priority: "media" });
      toast({ title: "Ticket creado", description: "Soporte recibio tu solicitud correctamente." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo crear el ticket",
        description: "Intenta nuevamente en unos segundos.",
      });
    } finally {
      setIsSupportLoading(false);
    }
  };

  const handleExportPrivacyData = async () => {
    if (!user) {
      return;
    }

    try {
      const data = await exportPrivacyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `pae-datos-${user.id}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: "Exportacion generada", description: "Se descargo una copia JSON de tus datos." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo exportar",
        description: "Revisa tu conexion o vuelve a iniciar sesion.",
      });
    }
  };

  const handleDeletionRequest = async () => {
    setIsSupportLoading(true);
    try {
      const ticket = await requestAccountDeletion(
        deletionReason.trim() || "Solicito la revision para eliminacion de mis datos personales.",
      );
      setSupportTickets((current) => [ticket, ...current]);
      setDeletionReason("");
      toast({ title: "Solicitud registrada", description: "Privacidad revisara el caso antes de cualquier accion." });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo registrar",
        description: "Intenta nuevamente en unos segundos.",
      });
    } finally {
      setIsSupportLoading(false);
    }
  };

  if (isLoading || !user || !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Cabecera del Perfil */}
      <Card className="overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#00FF6A] to-[#FF8A00]" />
        <CardContent className="relative -mt-16 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Avatar con botón de editar */}
            <div className="relative">
              <Avatar className="h-32 w-32 border-4 border-white shadow-xl">
                <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl font-bold">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-brand-action hover:bg-brand-action/90 shadow-lg"
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>

            {/* Información Principal */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-3xl font-bold text-primary-contrast">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <Badge className="bg-brand-action/10 text-brand-action font-semibold">
                    {user.role === "docente" ? "Docente" : "Estudiante"}
                  </Badge>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>ID:</span>
                    <code className="px-2 py-1 bg-neutral-100 rounded text-xs font-mono">
                      {user.id}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={handleCopyId}
                    >
                      {copiedId ? (
                        <Check className="h-3 w-3 text-green-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Estadísticas Rápidas */}
              <div className="flex gap-6">
                <div>
                  <p className="text-2xl font-bold text-primary-contrast">{stats.coursesCount}</p>
                  <p className="text-sm text-muted-foreground">Cursos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-contrast">{stats.achievementsCount}</p>
                  <p className="text-sm text-muted-foreground">Logros</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary-contrast">{stats.connectionsCount}</p>
                  <p className="text-sm text-muted-foreground">Conexiones</p>
                </div>
              </div>
            </div>

            {/* Botón de Cerrar Sesión */}
            <Button
              variant="outline"
              className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              onClick={() => setShowLogoutConfirm(true)}
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Panel de Configuración con Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
          <TabsTrigger value="personal">Información Personal</TabsTrigger>
          <TabsTrigger value="security">Seguridad</TabsTrigger>
          <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          <TabsTrigger value="support">Soporte</TabsTrigger>
          <TabsTrigger value="privacy">Privacidad</TabsTrigger>
        </TabsList>

        {/* TAB 1: Información Personal */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
              <CardDescription>
                Actualiza tu información de perfil y datos de contacto.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombres</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apellidos</FormLabel>
                          <FormControl>
                            <Input placeholder="Tus apellidos" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Correo Electrónico</FormLabel>
                        <FormControl>
                          <Input {...field} disabled className="bg-neutral-50" />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          El correo no puede ser modificado.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="institution"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Institución</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tu institución" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Universidad Nacional Mayor de San Marcos">
                              Universidad Nacional Mayor de San Marcos
                            </SelectItem>
                            <SelectItem value="Universidad Nacional de Ingeniería">
                              Universidad Nacional de Ingeniería
                            </SelectItem>
                            <SelectItem value="Pontificia Universidad Católica del Perú">
                              Pontificia Universidad Católica del Perú
                            </SelectItem>
                            <SelectItem value="Universidad Nacional Federico Villarreal">
                              Universidad Nacional Federico Villarreal
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Biografía / Sobre mí</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Cuéntanos un poco sobre ti..."
                            className="resize-none"
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Máximo 500 caracteres
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-brand-action hover:bg-brand-action/90"
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Guardando..." : "Guardar Cambios"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Seguridad */}
        <TabsContent value="security" className="space-y-6">
          {/* Cambio de Contraseña */}
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Mantén tu cuenta segura actualizando tu contraseña regularmente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contrasena actual</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" autoComplete="current-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nueva Contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="******" autoComplete="new-password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <p className="text-sm text-amber-800 font-medium">
                      ⚠️ Al cambiar tu contraseña, cerraremos todas tus sesiones activas y deberás iniciar sesión nuevamente.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      className="bg-brand-action hover:bg-brand-action/90"
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Actualizando..." : "Cambiar Contraseña"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Historial de Sesiones */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Historial de Sesiones</CardTitle>
                  <CardDescription>
                    Dispositivos donde has iniciado sesión recientemente.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logoutAllSessions}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.map((session, index) => (
                  <div
                    key={index}
                    className={`flex items-start gap-4 p-4 rounded-lg border ${
                      session.isCurrent
                        ? "bg-green-50 border-green-200"
                        : "bg-neutral-50 border-neutral-200"
                    }`}
                  >
                    <div className="p-2 bg-white rounded-lg">
                      <Monitor className="h-5 w-5 text-brand-action" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm">{session.device}</p>
                        {session.isCurrent && (
                          <Badge className="bg-green-100 text-green-700 text-xs">
                            Actual
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{session.location}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{session.lastActive}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Preferencias */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de la Aplicacion</CardTitle>
              <CardDescription>
                Personaliza tu experiencia en la plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-sm font-semibold text-primary-contrast">Apariencia</h3>
                  {isSyncing && <span className="text-xs text-muted-foreground">Sincronizando...</span>}
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">Modo oscuro</p>
                      <p className="text-xs text-muted-foreground">
                        Activa el tema oscuro para reducir la fatiga visual
                      </p>
                    </div>
                    <Button
                      variant={preferences.theme === "dark" ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={() => updatePreferences({ theme: preferences.theme === "dark" ? "light" : "dark" })}
                    >
                      {preferences.theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      {preferences.theme === "dark" ? "Claro" : "Oscuro"}
                    </Button>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-sm">Tamano de fuente</p>
                      <p className="text-xs text-muted-foreground">
                        Ajusta el tamano del texto en la plataforma
                      </p>
                    </div>
                    <Select
                      value={preferences.fontSize}
                      onValueChange={(fontSize) => updatePreferences({ fontSize: fontSize as typeof preferences.fontSize })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Pequeno</SelectItem>
                        <SelectItem value="medium">Medio</SelectItem>
                        <SelectItem value="large">Grande</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <Globe2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Idioma</p>
                        <p className="text-xs text-muted-foreground">
                          Define el locale base para formatos y futuras traducciones
                        </p>
                      </div>
                    </div>
                    <Select
                      value={preferences.language}
                      onValueChange={(language) => updatePreferences({ language: language as SupportedLocale })}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_LOCALES.map((locale) => (
                          <SelectItem key={locale} value={locale}>
                            {LOCALE_LABELS[locale]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="reduce-motion"
                      checked={preferences.reduceMotion}
                      onCheckedChange={(checked) => updatePreferences({ reduceMotion: checked === true })}
                    />
                    <div className="space-y-1">
                      <label htmlFor="reduce-motion" className="text-sm font-medium leading-none cursor-pointer">
                        Reducir movimiento
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Disminuye animaciones para una experiencia mas estable.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="high-contrast"
                      checked={preferences.highContrast}
                      onCheckedChange={(checked) => updatePreferences({ highContrast: checked === true })}
                    />
                    <div className="space-y-1">
                      <label htmlFor="high-contrast" className="text-sm font-medium leading-none cursor-pointer">
                        Alto contraste
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Refuerza bordes y contraste para mejorar legibilidad.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary-contrast">Notificaciones</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="email-reminders"
                      checked={preferences.emailReminders}
                      onCheckedChange={(checked) => updatePreferences({ emailReminders: checked === true })}
                    />
                    <div className="space-y-1">
                      <label htmlFor="email-reminders" className="text-sm font-medium leading-none cursor-pointer">
                        Correos de recordatorio
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Recibe recordatorios sobre tareas y evaluaciones
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="new-challenges"
                      checked={preferences.challengeNotifications}
                      onCheckedChange={(checked) => updatePreferences({ challengeNotifications: checked === true })}
                    />
                    <div className="space-y-1">
                      <label htmlFor="new-challenges" className="text-sm font-medium leading-none cursor-pointer">
                        Nuevos desafios
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Notificaciones sobre desafios y trivias disponibles
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="group-messages"
                      checked={preferences.communityMessages}
                      onCheckedChange={(checked) => updatePreferences({ communityMessages: checked === true })}
                    />
                    <div className="space-y-1">
                      <label htmlFor="group-messages" className="text-sm font-medium leading-none cursor-pointer">
                        Mensajes de grupo
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Recibe notificaciones de mensajes en tus comunidades
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5 text-brand-action" />
                Soporte tecnico
              </CardTitle>
              <CardDescription>
                Registra incidencias, dudas de cuenta o solicitudes de accesibilidad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={supportForm.subject}
                onChange={(event) => setSupportForm((current) => ({ ...current, subject: event.target.value }))}
                placeholder="Asunto"
              />
              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  value={supportForm.category}
                  onValueChange={(category) => setSupportForm((current) => ({
                    ...current,
                    category: category as SupportTicket["category"],
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tecnico">Tecnico</SelectItem>
                    <SelectItem value="cuenta">Cuenta</SelectItem>
                    <SelectItem value="privacidad">Privacidad</SelectItem>
                    <SelectItem value="contenido">Contenido</SelectItem>
                    <SelectItem value="accesibilidad">Accesibilidad</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={supportForm.priority}
                  onValueChange={(priority) => setSupportForm((current) => ({
                    ...current,
                    priority: priority as SupportTicket["priority"],
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                value={supportForm.description}
                onChange={(event) => setSupportForm((current) => ({ ...current, description: event.target.value }))}
                rows={5}
                placeholder="Describe el problema o solicitud"
              />
              <div className="flex justify-end">
                <Button onClick={handleSupportSubmit} disabled={isSupportLoading} className="gap-2 bg-brand-action hover:bg-brand-action/90">
                  <Send className="h-4 w-4" />
                  {isSupportLoading ? "Enviando..." : "Crear ticket"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mis tickets</CardTitle>
              <CardDescription>Historial reciente de solicitudes registradas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {supportTickets.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aun no tienes tickets registrados.</p>
              ) : (
                supportTickets.map((ticket) => (
                  <div key={ticket.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="font-semibold text-primary-contrast">{ticket.subject}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{ticket.description}</p>
                      </div>
                      <Badge className="w-fit bg-brand-action/10 text-brand-action">{ticket.status}</Badge>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">
                      {ticket.category} - prioridad {ticket.priority}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-brand-action" />
                Privacidad y datos personales
              </CardTitle>
              <CardDescription>
                Gestiona solicitudes de datos con trazabilidad y revision administrativa.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <Button variant="outline" className="h-auto justify-start gap-3 p-4" onClick={handleExportPrivacyData}>
                <Download className="h-5 w-5 text-brand-action" />
                <span className="text-left">
                  <span className="block font-semibold">Exportar datos</span>
                  <span className="block text-xs text-muted-foreground">Descarga JSON</span>
                </span>
              </Button>
              <div className="rounded-lg border border-neutral-200 p-4">
                <Type className="mb-3 h-5 w-5 text-brand-action" />
                <p className="text-sm font-semibold">Preferencias parametrizadas</p>
                <p className="mt-1 text-xs text-muted-foreground">Tema, fuente, contraste y notificaciones se guardan por usuario.</p>
              </div>
              <div className="rounded-lg border border-neutral-200 p-4">
                <MailCheck className="mb-3 h-5 w-5 text-brand-action" />
                <p className="text-sm font-semibold">Solicitudes auditables</p>
                <p className="mt-1 text-xs text-muted-foreground">Privacidad y soporte quedan registrados como tickets.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Solicitud de eliminacion</CardTitle>
              <CardDescription>
                Esta accion crea un ticket de privacidad para revisar el alcance antes de modificar datos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={deletionReason}
                onChange={(event) => setDeletionReason(event.target.value)}
                rows={4}
                placeholder="Motivo o alcance de la solicitud"
              />
              <div className="flex justify-end">
                <Button variant="outline" onClick={handleDeletionRequest} disabled={isSupportLoading}>
                  Registrar solicitud
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmación de Logout */}
      {showLogoutConfirm && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <Card 
            className="max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary-contrast mb-2">
                  ¿Cerrar Sesión?
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Estás a punto de cerrar tu sesión. Tendrás que volver a iniciar sesión para acceder a tu cuenta.
                </p>
              </div>
            </div>
            <Separator className="mb-4" />
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Cerrar Sesión
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;
