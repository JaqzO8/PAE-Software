import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Toaster } from '../components/ui/Toaster';
import { AuthProvider } from '../context/AuthContext';
import { AppearanceProvider } from '../context/AppearanceContext';
import { useOfflineAttemptSync } from '../hooks/useOfflineAttemptSync';

// ... (Todos tus otros imports igual)
import { TeacherLayout } from '../components/layout/TeacherLayout';
import { StudentLayout } from '../components/layout/StudentLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { PublicRoute } from '../components/layout/PublicRoute'; 

import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

import Landing from '../pages/Landing';
import NotFound from '../pages/NotFound';

const TeacherDashboard = lazy(() => import('../pages/teacher/Dashboard'));
const TeacherRepoList = lazy(() => import('../pages/teacher/repositories/List'));
const TeacherExplore = lazy(() => import('../pages/teacher/repositories/Explore'));
const TeacherFavorites = lazy(() => import('../pages/teacher/repositories/Favorites'));
const TeacherRepoCreate = lazy(() => import('../pages/teacher/repositories/Create'));
const TeacherGroupsList = lazy(() => import('../pages/teacher/groups/List'));
const TeacherGroupDetail = lazy(() => import('../pages/teacher/groups/Detail'));
const TeacherGroupsExplore = lazy(() => import('../pages/teacher/groups/Explore'));
const TeacherForums = lazy(() => import('../pages/teacher/groups/Forums'));
const TeacherMyForums = lazy(() => import('../pages/teacher/groups/MyForums'));
const ManageRepository = lazy(() => import('../pages/teacher/repositories/Manage'));
const AddResource = lazy(() => import('../pages/teacher/repositories/AddResource'));
const AddLesson = lazy(() => import('../pages/teacher/repositories/AddLesson'));
const StudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const StudentExplore = lazy(() => import('../pages/student/repositories/Explore'));
const StudentFavorites = lazy(() => import('../pages/student/repositories/Favorites'));
const StudentGroupList = lazy(() => import('../pages/student/groups/List'));
const StudentGroupDetail = lazy(() => import('../pages/student/groups/Detail'));
const StudentGroupsExplore = lazy(() => import('../pages/student/groups/Explore'));
const StudentForums = lazy(() => import('../pages/student/groups/Forums'));
const StudentMyForums = lazy(() => import('../pages/student/groups/MyForums'));
const Courses = lazy(() => import('../pages/student/Courses'));
const CourseDetail = lazy(() => import('../pages/student/CourseDetail'));
const StudentPlanning = lazy(() => import('../pages/student/Planning'));
const StudentRepositoryDetail = lazy(() => import('../pages/student/repositories/Detail'));
const StudentLessonDetail = lazy(() => import('../pages/student/repositories/LessonDetail'));
const CommunityHubPage = lazy(() => import('../pages/community/CommunityHub'));
const Simulacros = lazy(() => import('../pages/learning/Simulacros'));
const ExamView = lazy(() => import('../pages/learning/ExamView'));
const ExamResults = lazy(() => import('../pages/learning/ExamResults'));
const Desafios = lazy(() => import('../pages/learning/Desafios'));
const Trivia = lazy(() => import('../pages/learning/Trivia'));
const QuestionBank = lazy(() => import('../pages/learning/QuestionBank'));
const OpenReview = lazy(() => import('../pages/learning/OpenReview'));
const SavedQuestions = lazy(() => import('../pages/learning/SavedQuestions'));
const GamificationPage = lazy(() => import('../pages/learning/Gamification'));
const Profile = lazy(() => import('../pages/Profile'));
const QualityDashboard = lazy(() => import('../pages/teacher/QualityDashboard'));
const Privacy = lazy(() => import('../pages/legal/Privacy'));
const Terms = lazy(() => import('../pages/legal/Terms'));
const Placeholder = lazy(() => import('../pages/Placeholder'));

const TeacherLayoutWrapper = () => <TeacherLayout><Outlet /></TeacherLayout>;
const StudentLayoutWrapper = () => <StudentLayout><Outlet /></StudentLayout>;
const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
    Cargando vista...
  </div>
);

const OfflineAttemptSync = () => {
  useOfflineAttemptSync();
  return null;
};

export const AppRouter = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppearanceProvider>
        <OfflineAttemptSync />
        <Suspense fallback={<RouteFallback />}>
        <Routes>
          {/* RUTAS PÚBLICAS GENERALES */}
          <Route path="/" element={<Landing />} />
          <Route path="/terminos" element={<Terms />} />
          <Route path="/privacidad" element={<Privacy />} />
          
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<Placeholder />} />
          </Route>

          {/* ZONA DOCENTE */}
          <Route element={<ProtectedRoute allowedRoles={['docente']} />}>
            <Route element={<TeacherLayoutWrapper />}>
              <Route path="/docente" element={<TeacherDashboard />} />
              <Route path="/docente/repositorios" element={<Navigate to="/docente/repositorios/explorar" replace />} />
              <Route path="/docente/repositorios/explorar" element={<TeacherExplore />} />
              <Route path="/docente/repositorios/mis-repos" element={<TeacherRepoList />} />
              <Route path="/docente/repositorios/favoritos" element={<TeacherFavorites />} />
              <Route path="/docente/crear-repositorio" element={<TeacherRepoCreate />} />
              <Route path="/docente/repositorios/gestionar/:id" element={<ManageRepository />} />
              <Route path="/docente/repositorios/gestionar/:id/agregar-recurso" element={<AddResource />} />
              <Route path="/docente/repositorios/gestionar/:id/agregar-leccion" element={<AddLesson />} />

              <Route path="/docente/grupos" element={<Navigate to="/docente/grupos/mis-grupos" replace />} />
              <Route path="/docente/grupos/mis-grupos" element={<TeacherGroupsList />} />
              <Route path="/docente/grupos/:id" element={<TeacherGroupDetail />} />
              <Route path="/docente/grupos/explorar" element={<TeacherGroupsExplore />} />
              <Route path="/docente/grupos/foros" element={<TeacherForums />} />
              <Route path="/docente/grupos/mis-foros" element={<TeacherMyForums />} />
              <Route path="/docente/grupos/bienestar" element={<CommunityHubPage />} />
              
              <Route path="/docente/aprendizaje/simulacros" element={<Simulacros />} />
              <Route path="/docente/aprendizaje/banco-preguntas" element={<QuestionBank />} />
              <Route path="/docente/aprendizaje/revision-abiertas" element={<OpenReview />} />
              <Route path="/docente/aprendizaje/preguntas-guardadas" element={<SavedQuestions />} />
              <Route path="/docente/aprendizaje/simulacros/examen" element={<ExamView />} />
              <Route path="/docente/aprendizaje/simulacros/resultados" element={<ExamResults />} />
              <Route path="/docente/aprendizaje/desafios" element={<Desafios />} />
              <Route path="/docente/aprendizaje/trivia" element={<Trivia />} />
              <Route path="/docente/aprendizaje/gamificacion" element={<GamificationPage />} />
              
              <Route path="/docente/perfil" element={<Profile />} />
              <Route path="/docente/calidad" element={<QualityDashboard />} />
              <Route path="/docente/*" element={<Navigate to="/docente" replace />} />
            </Route>
          </Route>

          {/* ZONA ESTUDIANTE */}
          <Route element={<ProtectedRoute allowedRoles={['estudiante']} />}>
            <Route element={<StudentLayoutWrapper />}>
              <Route path="/estudiante" element={<StudentDashboard />} />
              
              <Route path="/estudiante/repositorios" element={<Navigate to="/estudiante/explorar" replace />} />
              <Route path="/estudiante/explorar" element={<StudentExplore />} />
              <Route path="/estudiante/biblioteca" element={<StudentFavorites />} />
              <Route path="/estudiante/repositorios/:id" element={<StudentRepositoryDetail />} />
              <Route path="/estudiante/repositorios/:id/lecciones/:lessonId" element={<StudentLessonDetail />} />
              <Route path="/estudiante/grupos" element={<Navigate to="/estudiante/grupos/mis-grupos" replace />} />
              <Route path="/estudiante/grupos/mis-grupos" element={<StudentGroupList />} />
              <Route path="/estudiante/grupos/:id" element={<StudentGroupDetail />} />
              <Route path="/estudiante/grupos/explorar" element={<StudentGroupsExplore />} />
              <Route path="/estudiante/grupos/foros" element={<StudentForums />} />
              <Route path="/estudiante/grupos/mis-foros" element={<StudentMyForums />} />
              <Route path="/estudiante/grupos/bienestar" element={<CommunityHubPage />} />
              
              <Route path="/estudiante/aprendizaje/simulacros" element={<Simulacros />} />
              <Route path="/estudiante/aprendizaje/simulacros/examen" element={<ExamView />} />
              <Route path="/estudiante/aprendizaje/simulacros/resultados" element={<ExamResults />} />
              <Route path="/estudiante/aprendizaje/preguntas-guardadas" element={<SavedQuestions />} />
              <Route path="/estudiante/aprendizaje/desafios" element={<Desafios />} />
              <Route path="/estudiante/aprendizaje/trivia" element={<Trivia />} />
              <Route path="/estudiante/aprendizaje/gamificacion" element={<GamificationPage />} />
              
              <Route path="/estudiante/cursos" element={<Courses />} />
              <Route path="/estudiante/cursos/:courseTitle" element={<CourseDetail />} />
              <Route path="/estudiante/planificacion" element={<StudentPlanning />} />

              <Route path="/estudiante/perfil" element={<Profile />} />
              <Route path="/estudiante/*" element={<Navigate to="/estudiante" replace />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
        
        <Toaster />
        </AppearanceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};
