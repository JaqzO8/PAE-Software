// src/features/auth/components/RegisterForm.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { 
  Button, 
  Input, 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage, 
  Checkbox 
} from "../../../desingSystem/primitives";

import { register as registerService } from "../services/authServices";
import { useToast } from "../../../hooks/useToast";
import styles from "./auth.module.css";

// ========================================
// ESQUEMA DE VALIDACIÓN ACTUALIZADO
// ========================================
const registerSchema = z.object({
  nombres: z
    .string()
    .min(2, { message: "Los nombres deben tener al menos 2 caracteres" })
    .max(100, { message: "Los nombres son demasiado largos" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]+$/, { 
      message: "Los nombres solo pueden contener letras" 
    }),
  apellidos: z
    .string()
    .min(2, { message: "Los apellidos deben tener al menos 2 caracteres" })
    .max(100, { message: "Los apellidos son demasiado largos" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ'\s]+$/, { 
      message: "Los apellidos solo pueden contener letras" 
    }),
  email: z
    .string()
    .email({ message: "Correo inválido" })
    .max(100, { message: "El correo es demasiado largo" })
    .toLowerCase()
    .transform(val => val.trim()),
  password: z
    .string()
    .min(6, { message: "Mínimo 6 caracteres" })
    .max(100, { message: "La contraseña es demasiado larga" })
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/, { 
      message: "Debe contener al menos una letra y un número" 
    }),
  confirmPassword: z.string(),
  isTeacher: z.boolean(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

// ========================================
// COMPONENTE
// ========================================
export function RegisterForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      nombres: "", 
      apellidos: "",
      email: "", 
      password: "", 
      confirmPassword: "", 
      isTeacher: false 
    },
  });

  // ========================================
  // SUBMIT HANDLER
  // ========================================
  async function onSubmit(values: RegisterFormValues) {
    setIsLoading(true);
    
    try {
      // 1. Registrar usuario
      await registerService({
        nombres: values.nombres.trim(),
        apellidos: values.apellidos.trim(),
        email: values.email,
        password: values.password,
        isTeacher: values.isTeacher,
      });

      // 2. Toast de éxito
      toast({
        title: "¡Cuenta creada exitosamente!",
        description: "Ahora puedes iniciar sesión con tus credenciales.",
      });

      // 3. Redirigir al login
      setTimeout(() => {
        navigate("/login", { 
          replace: true, 
          state: { fromRegister: true, email: values.email } 
        });
      }, 1500);

    } catch (error: any) {
      console.error("Error en registro:", error);
      
      toast({
        variant: "destructive",
        title: "Error en registro",
        description: error.message || "No se pudo crear la cuenta. Intenta nuevamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  // ========================================
  // RENDER
  // ========================================
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={styles.loginContainer}>
        
        {/* Nombres y Apellidos */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="nombres"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombres</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Juan Carlos" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="apellidos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellidos</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Pérez García" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo Electrónico</FormLabel>
              <FormControl>
                <Input 
                  placeholder="usuario@pae.edu" 
                  type="email" 
                  {...field} 
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Contraseñas */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="******" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="******" 
                    {...field} 
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Checkbox Docente */}
        <FormField
          control={form.control}
          name="isTeacher"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Soy Docente</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Se requerirá validación institucional.
                </p>
              </div>
            </FormItem>
          )}
        />

        {/* Botón Submit */}
        <Button 
          type="submit" 
          className={styles.submitButton} 
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Creando cuenta...
            </>
          ) : (
            "Crear Cuenta"
          )}
        </Button>
      </form>
    </Form>
  );
}