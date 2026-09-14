import { Link } from "react-router-dom";
import { ArrowLeft, Database, LockKeyhole, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, Button } from "../../desingSystem/primitives";

const Privacy = () => {
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
          <p className="text-sm font-semibold text-brand-action">Cumplimiento y privacidad</p>
          <h1 className="text-3xl font-bold text-primary-contrast">Politica de Privacidad de PAE</h1>
          <p className="text-muted-foreground">
            PAE trata datos academicos, datos de cuenta y registros de actividad solo para operar la plataforma,
            mejorar la experiencia educativa y atender solicitudes de soporte.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Database,
              title: "Datos tratados",
              text: "Perfil, rol, sesiones, preferencias, progreso academico, participacion en comunidades y tickets de soporte.",
            },
            {
              icon: LockKeyhole,
              title: "Controles",
              text: "Cada usuario autenticado puede exportar sus datos y registrar solicitudes de privacidad desde su perfil.",
            },
            {
              icon: ShieldCheck,
              title: "Proteccion",
              text: "La API usa autenticacion, rate limiting, cabeceras de seguridad y separacion por microservicios.",
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
              Los datos personales no se venden ni se usan para publicidad externa. El acceso se limita a usuarios
              autenticados y a procesos administrativos necesarios para soporte, seguridad y continuidad del servicio.
            </p>
            <p>
              Las solicitudes de exportacion, rectificacion o eliminacion se registran como tickets de privacidad para
              mantener trazabilidad y revision responsable antes de ejecutar cambios irreversibles.
            </p>
            <p>
              La retencion de sesiones e historiales se reduce a lo necesario para seguridad operativa, auditoria y
              diagnostico. Los respaldos deben resguardarse cifrados o en almacenamiento controlado por la institucion.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Privacy;
