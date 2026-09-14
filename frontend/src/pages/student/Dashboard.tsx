// src/pages/student/Dashboard.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "../../desingSystem/primitives";
import { BookOpen, Users, Target, TrendingUp, Star, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStudentStats } from "../../features/dashboard/hooks/useStudentStats";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { stats, isLoading } = useStudentStats();
  const firstName = user?.nombres?.split(" ")[0] || "Estudiante";

  const quickActions = [
    {
      title: "Explorar Repositorios",
      description: "Descubre material educativo",
      icon: BookOpen,
      to: "/estudiante/explorar",
      color: "bg-blue-500",
    },
    {
      title: "Mis Comunidades",
      description: "Grupos de estudio activos",
      icon: Users,
      to: "/estudiante/grupos/mis-grupos",
      color: "bg-success-progress",
    },
    {
      title: "Simulacros",
      description: "Practica para tus examenes",
      icon: Target,
      to: "/estudiante/aprendizaje/simulacros",
      color: "bg-brand-action",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-primary-contrast">
          Bienvenido, {firstName}
        </h1>
        <p className="text-neutral-600">
          Aqui tienes un resumen de tu progreso academico.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-small font-medium">Recursos Guardados</CardTitle>
            <Star className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-h2 font-bold">{stats?.savedResources || 0}</div>
                <p className="text-small text-neutral-600 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success-progress" />
                  <span className="text-success-progress">+{stats?.weeklyGrowth || 0}</span> esta semana
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-small font-medium">Mis Comunidades</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-h2 font-bold">{stats?.activeCommunities || 0}</div>
                <p className="text-small text-neutral-600 mt-1">Grupos activos</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-small font-medium">Tiempo de Estudio</CardTitle>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.studyHours || 0}h</div>
                <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-small font-medium">Simulacros</CardTitle>
            <Target className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.simulacrosCompleted || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Intentos finalizados</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-small font-medium">Precision</CardTitle>
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.averageAccuracy || 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">Promedio</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seguimiento de rendimiento</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border bg-neutral-50 p-4">
                <p className="text-sm text-muted-foreground">Mejor puntaje</p>
                <p className="mt-1 text-2xl font-bold text-primary-contrast">{stats?.bestScore || 0}</p>
              </div>
              <div className="rounded-md border bg-neutral-50 p-4">
                <p className="text-sm text-muted-foreground">Comparativa cohorte</p>
                <p className="mt-1 text-2xl font-bold text-primary-contrast">
                  {stats?.cohortAverageAccuracy || 0}%
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stats?.cohortGap
                    ? `${stats.cohortGap > 0 ? "+" : ""}${stats.cohortGap} pts frente al promedio`
                    : "Promedio general"}
                </p>
              </div>
              <div className="rounded-md border bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-semibold">Recomendacion</p>
                <p className="mt-1">
                  {stats?.learningRecommendation || "Completa tu primer simulacro para generar recomendaciones personalizadas."}
                </p>
                {stats?.weakSubject && (
                  <p className="mt-2 text-xs text-blue-700">Tema a reforzar: {stats.weakSubject}</p>
                )}
                {stats?.cohortPercentile && (
                  <p className="mt-2 text-xs text-blue-700">Percentil academico: {stats.cohortPercentile}</p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ritmo de estudio</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-20 w-full" />
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-md border bg-neutral-50 p-4">
                <p className="text-sm text-muted-foreground">Lecciones completadas</p>
                <p className="mt-1 text-2xl font-bold text-primary-contrast">{stats?.completedLessons || 0}</p>
              </div>
              <div className="rounded-md border bg-neutral-50 p-4">
                <p className="text-sm text-muted-foreground">Promedio por leccion</p>
                <p className="mt-1 text-2xl font-bold text-primary-contrast">{stats?.averageLessonMinutes || 0} min</p>
              </div>
              <div className="rounded-md border bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Habitos detectados</p>
                <p className="mt-1">
                  {stats?.studyRecommendation || "Completa una leccion para generar seguimiento de habitos."}
                </p>
                <p className="mt-2 text-xs">
                  Sesiones largas: {stats?.longStudySessions || 0} | Cierres rapidos: {stats?.fastCompletions || 0}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-h2 font-bold text-primary-contrast mb-4">Acciones Rapidas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to}>
              <Card className="hover:shadow-lg transition-all cursor-pointer hover:border-brand-action/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 p-4 bg-neutral-50 rounded-lg">
                    <div className={`p-3 rounded-lg ${action.color}`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-h3 font-semibold text-primary-contrast mb-1">
                        {action.title}
                      </h3>
                      <p className="text-small text-neutral-600">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
