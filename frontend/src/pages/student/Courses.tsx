import { Card, CardContent } from "../../desingSystem/primitives/Card";
import { BookOpen } from "lucide-react";
import { Button } from "../../desingSystem/primitives/Button";
import { Progress } from "../../desingSystem/primitives/Progress";
import { useNavigate } from "react-router-dom";

const coursesData = [
  {
    title: "Álgebra",
    description: "Conceptos básicos y avanzados del álgebra.",
    progress: 60,
    started: true,
  },
  {
    title: "Aritmética",
    description: "Fundamentos esenciales de los números y operaciones.",
    progress: 0,
    started: false,
  },
  {
    title: "Geometría",
    description: "Exploración de figuras, formas y propiedades espaciales.",
    progress: 35,
    started: true,
  },
  {
    title: "Física",
    description: "Introducción a conceptos fundamentales de la física.",
    progress: 0,
    started: false,
  },
  {
    title: "Razonamiento Verbal",
    description: "Desarrollo de habilidades de comprensión y análisis.",
    progress: 80,
    started: true,
  },
  {
    title: "Humanidades",
    description: "Reflexión sobre temas culturales y sociales.",
    progress: 0,
    started: false,
  },
];

export default function Courses() {
    const navigate = useNavigate();

    const handleOpenCourse = (course: any) => {
        navigate(`/estudiante/cursos/${encodeURIComponent(course.title)}`, {
            state: { course }, // aquí mandamos la info del curso
        });
    };

  return (
    <div className="mb-8">
      {/* TITULO */}
      <div className="flex items-center gap-2 mb-1">
        <BookOpen className="w-7 h-7 text-orange-500" />
        <h1 className="text-3xl font-bold tracking-tight text-[#143B8F]">
            Cursos
        </h1>
    </div>

    <p className="text-sm text-[#143B8F] mb-4">
        Explora, continúa y completa tus cursos activos para seguir creciendo.
    </p>
      {/* GRID DE CURSOS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">

        {coursesData.map((course, index) => (
          <Card key={index} className="rounded-2xl shadow-md border border-transparent hover:border-orange-500 transition-all duration-300">
            <CardContent className="p-5">

              {/* Título */}
              <h2 className="text-xl font-semibold mb-1 text-[#143B8F]">{course.title}</h2>

              {/* Descripción */}
              <p className="text-sm text-[#143B8F] mb-4">
                {course.description}
              </p>

              {/* Progreso */}
              <Progress value={course.progress} />

              <div className="flex justify-between items-center mt-3">
                <span className="text-sm text-gray-700 font-medium">
                  {course.progress}% completado
                </span>
              </div>

              {/* BOTONES */}
              <div className="flex gap-3 mt-4">
                {course.started ? (
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => handleOpenCourse(course)}>
                    Retomar curso
                  </Button>
                ) : (
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => handleOpenCourse(course)}>
                    Comenzar curso
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

      </div>
    </div>
  );
}


