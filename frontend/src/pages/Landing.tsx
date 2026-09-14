import { useState } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Facebook,
  CheckCircle,
} from "lucide-react";
import { Button } from "../desingSystem/primitives"; // Verifica si es 'desingSystem' o 'designSystem'

const Landing = () => {
  const [currentService, setCurrentService] = useState(0);

  const services = [
    {
      icon: BookOpen,
      title: "Cursos Preuniversitarios",
      description: "Material completo y actualizado para tu preparación académica con los mejores docentes.",
    },
    {
      icon: GraduationCap,
      title: "Simulacros de Examen",
      description: "Practica con exámenes reales de las principales universidades y mide tu progreso.",
    },
    {
      icon: CheckCircle,
      title: "Banco de Preguntas",
      description: "Accede a miles de preguntas organizadas por tema, dificultad y universidad.",
    },
  ];

  const benefits = [
    "Plataforma disponible 24/7 desde cualquier dispositivo",
    "Resultados inmediatos en tus simulacros",
    "Material educativo validado por expertos",
    "Comunidad activa de estudiantes",
    "Seguimiento personalizado de tu avance",
  ];

  const handlePrevService = () => {
    setCurrentService((prev) => (prev === 0 ? services.length - 1 : prev - 1));
  };

  const handleNextService = () => {
    setCurrentService((prev) => (prev === services.length - 1 ? 0 : prev + 1));
  };

  const CurrentServiceIcon = services[currentService].icon;

  return (
    <div className="min-h-screen bg-neutral-50 font-sans text-neutral-900">
      
      {/* ========== HEADER ========== */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-neutral-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="h-9 w-9 rounded-xl bg-brand-action flex items-center justify-center shadow-md transition-transform group-hover:scale-105">
                <span className="text-white font-extrabold text-lg">P</span>
              </div>
              <span className="text-xl font-bold text-primary-contrast tracking-tight">PAE</span>
            </Link>

            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="ghost" className="text-neutral-600 hover:text-brand-action hover:bg-brand-action/5">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-brand-action hover:bg-brand-action/90 text-white shadow-md hover:shadow-lg transition-all">
                  Crear Cuenta Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ========== HERO SECTION (Con Fallback de Imagen) ========== */}
      {/* Agregamos bg-neutral-900 como respaldo si la imagen falla */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden bg-neutral-900">
        
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2000&auto=format&fit=crop"
            alt="Estudiantes"
            className="w-full h-full object-cover opacity-90 transition-opacity duration-500"
            onError={(e) => {
              // Si falla la carga, ocultamos la imagen rota para que se vea el fondo oscuro limpio
              e.currentTarget.style.display = "none";
              // Opcional: Podrías poner una imagen de placeholder:
              // e.currentTarget.src = "https://placehold.co/1920x600/111827/FFFFFF?text=PAE+Education";
              // e.currentTarget.style.display = "block";
            }}
          />
          {/* Overlay gradiente siempre visible */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-contrast/95 via-primary-contrast/80 to-primary-contrast/50" />
        </div>

        {/* Contenido Hero */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center space-y-6">
          <div className="inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            🚀 Tu éxito académico empieza hoy
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight drop-shadow-lg animate-in fade-in slide-in-from-bottom-6 duration-700">
            Plataforma de{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00FF7F] to-[#FF6A00]">
            Apoyo Estudiantil
          </span>
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed drop-shadow-md animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
            Únete a la comunidad educativa más grande y accede a herramientas diseñadas para potenciar tu aprendizaje.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
            <Link to="/register">
              <Button size="lg" className="bg-brand-action hover:bg-brand-action/90 text-white px-8 h-12 rounded-full text-lg shadow-xl hover:scale-105 transition-transform">
                Comenzar Gratis
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20 px-8 h-12 rounded-full text-lg">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ========== BENEFICIOS & CARACTERÍSTICAS ========== */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Texto y Lista */}
            <div className="space-y-8 animate-in slide-in-from-left duration-700">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 leading-tight">
                Todo lo que necesitas para <span className="text-[#00FF7F]">triunfar</span>
              </h2>
              <p className="text-neutral-600 text-lg">
                Nuestra plataforma está diseñada pensando en tus necesidades. Olvídate del material desactualizado y estudia a tu propio ritmo.
              </p>

              <div className="grid gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-neutral-50 transition-colors border border-transparent hover:border-neutral-100">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-brand-action/10 flex items-center justify-center text-brand-action">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-800">{benefit}</p>
                      <p className="text-sm text-neutral-500 mt-1">Beneficio exclusivo para miembros.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ilustración / Icono Gigante */}
            <div className="relative flex justify-center animate-in slide-in-from-right duration-700 delay-200">
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-action/20 to-blue-500/20 rounded-full blur-[100px]" />
              <div className="relative bg-white rounded-[2rem] p-8 shadow-2xl border border-neutral-100 transform hover:-rotate-2 transition-transform duration-500">
                <div className="bg-gradient-to-br from-[#FF6A00] to-[#00FF7F] rounded-2xl p-12 text-white shadow-inner">
                  <GraduationCap className="h-48 w-48 drop-shadow-2xl" />
                </div>
                {/* Floating Badge */}
                <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-xl border border-neutral-100 flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-full text-green-600">
                    <CheckCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-neutral-500 font-medium">Estudiantes</p>
                    <p className="text-xl font-bold text-neutral-800">+10,000</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SERVICIOS (Carrusel) ========== */}
      <section className="py-24 bg-neutral-900 text-white relative overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-action rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px]" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-16">
            Nuestros <span className="text-brand-action">Servicios</span> Principales
          </h2>

          <div className="relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-8 md:p-16 max-w-4xl mx-auto shadow-2xl transition-all duration-500">
            {/* Contenido del Slide */}
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500" key={currentService}>
              <div className="p-6 bg-brand-action rounded-2xl shadow-lg shadow-brand-action/20">
                <CurrentServiceIcon className="h-16 w-16 text-white" />
              </div>
              <h3 className="text-3xl font-bold">{services[currentService].title}</h3>
              <p className="text-lg text-neutral-300 max-w-xl mx-auto">
                {services[currentService].description}
              </p>
            </div>

            {/* Controles de Navegación */}
            <div className="mt-12 flex items-center justify-center gap-6">
              <button 
                onClick={handlePrevService}
                className="p-3 rounded-full border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all group"
              >
                <ChevronLeft className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </button>
              
              {/* Dots */}
              <div className="flex gap-3">
                {services.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentService(index)}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      index === currentService ? "w-8 bg-brand-action" : "w-2.5 bg-white/20 hover:bg-white/40"
                    }`}
                  />
                ))}
              </div>

              <button 
                onClick={handleNextService}
                className="p-3 rounded-full border border-white/20 hover:bg-white/10 hover:border-white/40 transition-all group"
              >
                <ChevronRight className="h-6 w-6 text-white group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========== CTA FINAL (Con Fallback de Imagen) ========== */}
      <section className="relative py-24 bg-gradient-to-br from-brand-action to-blue-700 overflow-hidden">
        {/* Patrón de fondo (Si falla, queda el gradiente azul bonito) */}
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative max-w-4xl mx-auto text-center px-4 space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight">
            ¿Listo para alcanzar tu máximo potencial?
          </h2>
          <p className="text-xl text-blue-100">
            No pierdas más tiempo. Regístrate hoy y accede a todas las herramientas que necesitas.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-brand-action hover:bg-neutral-100 hover:scale-105 transition-all text-lg px-10 h-14 rounded-full shadow-xl font-bold">
              ¡Quiero unirme ahora!
            </Button>
          </Link>
        </div>
      </section>

      {/* ========== FOOTER ========== */}
      <footer className="bg-neutral-900 border-t border-neutral-800 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            
            {/* Branding */}
            <div className="col-span-1 md:col-span-1 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-brand-action flex items-center justify-center">
                  <span className="text-white font-bold">P</span>
                </div>
                <span className="text-xl font-bold text-white">PAE</span>
              </div>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Plataforma integral diseñada para apoyar a estudiantes en su camino hacia la excelencia académica.
              </p>
            </div>

            {/* Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Plataforma</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link to="/login" className="hover:text-brand-action transition-colors">Iniciar Sesión</Link></li>
                <li><Link to="/register" className="hover:text-brand-action transition-colors">Registro</Link></li>
                <li><a href="#" className="hover:text-brand-action transition-colors">Cursos</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><a href="#" className="hover:text-brand-action transition-colors">Términos de uso</a></li>
                <li><a href="#" className="hover:text-brand-action transition-colors">Privacidad</a></li>
                <li><a href="#" className="hover:text-brand-action transition-colors">Cookies</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="text-white font-semibold mb-4">Síguenos</h4>
              <div className="flex gap-4">
                <a href="#" className="p-2 bg-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-brand-action transition-all">
                  <Instagram className="h-5 w-5" />
                </a>
                <a href="#" className="p-2 bg-neutral-800 rounded-lg text-neutral-400 hover:text-white hover:bg-brand-action transition-all">
                  <Facebook className="h-5 w-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-neutral-800 pt-8 text-center">
            <p className="text-neutral-500 text-sm">
              © 2025 PAE - Plataforma de Apoyo Estudiantil. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;