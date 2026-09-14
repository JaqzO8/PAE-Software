import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../../desingSystem/primitives/Card";
import { Progress } from "../../desingSystem/primitives/Progress";
import { Button } from "../../desingSystem/primitives/Button";
import { Lock } from "lucide-react";
import { CheckCircle } from "lucide-react";

interface Course {
    title: string;
    description: string;
    progress: number;
    started: boolean;
}

interface LocationState {
    course?: Course;
}

export default function CourseDetail() {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState;
    const course = state?.course;

    // Si alguien entra directo a la URL sin venir desde la lista de cursos
    if (!course) {
        return (
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#143B8F] mb-2">
                    Curso no encontrado
                </h1>
                <p className="mb-4 text-sm text-gray-700">
                    No se encontró la información del curso. Vuelve a la lista de cursos.
                </p>
                <Button onClick={() => navigate("/estudiante/cursos")}>
                    Volver a cursos
                </Button>
            </div>
        );
    }

    // Unidades del curso (puedes personalizar por curso si quieres)
    const units = [
        {
            title: "Unidad 1: Introducción",
            description: "Conceptos básicos y panorama general del curso.",
            progress: 100,
            locked: false,
        },
        {
            title: "Unidad 2: Desarrollo",
            description: "Temas intermedios y ejercicios aplicados.",
            progress: 40,
            locked: false,
        },
        {
            title: "Unidad 3: Evaluación final",
            description: "Problemas avanzados y evaluación del aprendizaje.",
            progress: 0,
            locked: true, // ESTA ES LA UNIDAD BLOQUEADA
        },
    ];

    return (
        <div className="mb-8">
            {/* Título principal */}
            <h1 className="text-3xl font-bold tracking-tight text-[#143B8F] mb-2">
                Bienvenido al curso de {course.title}
            </h1>

            {/* Descripción del curso */}
            <p className="text-sm text-[#143B8F] mb-6 max-w-2xl">
                {course.description} En este curso verás temas clave relacionados con
                {` ${course.title.toLowerCase()}`}, organizados por unidades para que
                avances paso a paso.
            </p>

            {/* Tarjetas por unidades */}
            <div className="flex flex-col gap-6">
                {units.map((unit, index) => (
                    <Card
                        key={index}
                        className={`
                rounded-2xl shadow-md border border-transparent hover:border-orange-500 transition-all duration-300
                ${unit.locked
                                ? "bg-gray-200 border-gray-300"
                                : unit.progress === 100
                                    ? "bg-green-400" // tarjeta verde
                                    : "bg-white"
                            }
                    `}
                    >
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-2">
                                <h2
                                    className={`
                    text-lg font-semibold
                    ${unit.locked
                                            ? "text-gray-600"      // título gris para unidad bloqueada
                                            : "text-[#143B8F]"     // título azul para unidades activas
                                        }
                        `}
                                >
                                    {unit.title}
                                </h2>
                                {/* Ícono a la derecha */}
                                {unit.locked ? (
                                    <Lock className="w-5 h-5 text-gray-500" />
                                ) : unit.progress === 100 ? (
                                    <CheckCircle className="w-6 h-6 text-green-600" />
                                ) : null}
                            </div>

                            <p className="text-sm text-gray-700 mb-3">
                                {unit.description}
                            </p>

                            <Progress
                                value={unit.progress}
                                className={unit.progress === 100 ? "bg-green-500" : "bg-orange-500"}
                            />

                            <span className="text-xs text-gray-700 mt-2 block">
                                {unit.locked
                                    ? "Bloqueado"
                                    : unit.progress === 100
                                        ? "Completado"
                                        : unit.progress > 0
                                            ? "En progreso"
                                            : "Sin comenzar"}
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
