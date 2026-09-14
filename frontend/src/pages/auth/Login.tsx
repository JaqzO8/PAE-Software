// src/pages/auth/Login.tsx
import { Link, useLocation } from "react-router-dom"; // ✅ 1. Importar useLocation
import { CheckCircle } from "lucide-react"; // ✅ 2. Importar el icono que faltaba
import { LoginForm } from "../../features/auth/components/LoginForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../desingSystem/primitives"; //

const Login = () => {
  const location = useLocation(); // ✅ 3. Obtener el objeto location
  
  // ✅ 4. Leer el estado de la navegación (si existe)
  // Esto será true si vienes de un navigate("/login", { state: { fromRegister: true } })
  const fromRegister = location.state?.fromRegister;

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md space-y-6">
        
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="h-12 w-12 rounded-xl bg-brand-action flex items-center justify-center">
            <span className="text-white font-bold text-xl">P</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary-contrast">
            Bienvenido a PAE
          </h1>
          <p className="text-sm text-muted-foreground">
            Plataforma de Apoyo Estudiantil
          </p>
        </div>

        {/* Mensaje de éxito si viene desde registro */}
        {fromRegister && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 text-sm">
                ¡Cuenta creada exitosamente!
              </p>
              <p className="text-green-700 text-xs mt-1">
                Ahora puedes iniciar sesión con tus credenciales.
              </p>
            </div>
          </div>
        )}

        <Card className="shadow-lg border-neutral-200/60">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
            <CardDescription>
              Ingresa tus credenciales para acceder a tu panel.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <LoginForm />
          </CardContent>
          
          <CardFooter className="flex flex-col space-y-2 text-center text-sm text-muted-foreground">
            <div>
              ¿No tienes una cuenta?{" "}
              <Link 
                to="/register" 
                className="text-brand-action hover:underline font-medium"
              >
                Regístrate aquí
              </Link>
            </div>
          </CardFooter>
        </Card>

        <p className="px-8 text-center text-xs text-muted-foreground">
          Al continuar, aceptas nuestros{" "}
          <Link to="/terminos" className="underline hover:text-brand-action">
            Términos de Servicio
          </Link>{" "}
          y{" "}
          <Link to="/privacidad" className="underline hover:text-brand-action">
            Política de Privacidad
          </Link>.
        </p>
      </div>
    </div>
  );
};

export default Login;
