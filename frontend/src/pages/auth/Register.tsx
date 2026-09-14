import { Link } from "react-router-dom";
import { RegisterForm } from "../../features/auth/components/RegisterForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../../desingSystem/primitives";

const Register = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-contrast">Únete a PAE</h1>
        </div>

        <Card className="shadow-lg border-neutral-200/60">
          <CardHeader>
            <CardTitle>Crear Cuenta</CardTitle>
            <CardDescription>Comienza tu viaje de aprendizaje hoy.</CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta? <Link to="/login" className="text-brand-action hover:underline ml-1">Inicia Sesión</Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Register;