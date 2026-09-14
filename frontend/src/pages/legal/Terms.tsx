import { Link } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, CircleAlert, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../desingSystem/primitives";

const Terms = () => {
  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Button asChild variant="ghost" className="gap-2">
          <Link to="/login">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
        </Button>

        <section className="space-y-3">
          <p className="text-sm font-semibold text-brand-action">Condiciones de uso</p>
          <h1 className="text-3xl font-bold text-primary-contrast">Terminos de Servicio de PAE</h1>
          <p className="text-muted-foreground">
            Estos terminos definen el uso responsable de la plataforma, sus comunidades, evaluaciones y recursos
            academicos compartidos por docentes y estudiantes.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: BookOpenCheck,
              title: "Uso academico",
              text: "Los recursos, simulacros y comunidades deben emplearse para aprendizaje, orientacion y colaboracion.",
            },
            {
              icon: CircleAlert,
              title: "Conducta",
              text: "No se permite suplantacion, acoso, publicacion de contenido danino ni manipulacion de resultados.",
            },
            {
              icon: Scale,
              title: "Responsabilidad",
              text: "La institucion puede revisar reportes y tickets para preservar seguridad, integridad y continuidad.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <item.icon className="h-5 w-5 text-brand-action" />
                <CardTitle className="text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6 text-sm leading-6 text-muted-foreground">
            <p>
              El usuario se compromete a mantener credenciales seguras y a reportar incidentes desde el modulo de soporte.
              Los docentes son responsables de revisar la pertinencia pedagogica de los contenidos que publican.
            </p>
            <p>
              PAE puede registrar actividad tecnica y academica necesaria para evaluaciones, sincronizacion offline,
              gamificacion, seguridad de cuenta y mejora del servicio.
            </p>
            <p>
              El incumplimiento de estas reglas puede llevar a suspension temporal de funciones, revision administrativa o
              cierre de cuenta segun la politica de la institucion.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Terms;
