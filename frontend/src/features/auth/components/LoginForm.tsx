import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  Button,
  Input,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../desingSystem/primitives";

import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../hooks/useToast";
import { quickLogin, requestPasswordReset } from "../services/authServices";
import styles from "./auth.module.css";

const formSchema = z.object({
  email: z.string().email({ message: "Correo invalido" }),
  password: z.string().min(1, { message: "Contrasena requerida" }),
});

export function LoginForm() {
  const { login, isLoading, setAuthData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isQuickLoading, setIsQuickLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (location.state?.email) {
      form.setValue("email", location.state.email);
    }
  }, [location.state, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await login(values.email, values.password);
    } catch (error) {
      console.error("Error en login:", error);
    }
  }

  async function handleQuickLogin() {
    const email = form.getValues("email") || "demo.estudiante@pae.edu";
    setIsQuickLoading(true);
    try {
      const response = await quickLogin(email);
      setAuthData(response.user, response.token);
      toast({ title: "Login rapido activo", description: "Ingresaste con el flujo social de prueba." });
      navigate(response.user.rol === "docente" ? "/docente" : "/estudiante", { replace: true });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "No se pudo iniciar rapido",
        description: error.message || "Intenta nuevamente.",
      });
    } finally {
      setIsQuickLoading(false);
    }
  }

  async function handlePasswordRecovery() {
    const email = resetEmail || form.getValues("email");
    if (!email) return;

    const response = await requestPasswordReset(email);
    toast({
      title: "Recuperacion solicitada",
      description: response.resetToken
        ? `Token de desarrollo: ${response.resetToken.slice(0, 12)}...`
        : response.message,
    });
    setIsRecoveryOpen(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.loginContainer}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electronico</FormLabel>
              <FormControl>
                <Input placeholder="usuario@pae.edu" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Contrasena</FormLabel>
                <button
                  type="button"
                  className={styles.forgotPasswordLink}
                  onClick={() => {
                    setResetEmail(form.getValues("email"));
                    setIsRecoveryOpen((value) => !value);
                  }}
                >
                  Olvide mi contrasena
                </button>
              </div>
              <FormControl>
                <Input type="password" placeholder="******" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className={styles.submitButton} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ingresando...
            </>
          ) : (
            "Ingresar"
          )}
        </Button>

        {isRecoveryOpen && (
          <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <Input
              type="email"
              placeholder="correo@pae.edu"
              value={resetEmail}
              onChange={(event) => setResetEmail(event.target.value)}
            />
            <Button type="button" variant="outline" className="w-full" onClick={handlePasswordRecovery}>
              Enviar recuperacion
            </Button>
          </div>
        )}

        <Button type="button" variant="outline" className="w-full" onClick={handleQuickLogin} disabled={isQuickLoading}>
          {isQuickLoading ? "Conectando..." : "Login rapido con Google"}
        </Button>
      </form>
    </Form>
  );
}
