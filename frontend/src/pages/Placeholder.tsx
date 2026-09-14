const Placeholder = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[70vh] p-8">
      {/* Icono o indicador visual */}
      <div className="bg-gray-100 p-6 rounded-full mb-6 animate-pulse">
        <span className="text-5xl" role="img" aria-label="construcción">
          🚧
        </span>
      </div>

      {/* Título con color de marca */}
      <h2 className="text-3xl font-bold text-primary-contrast mb-3">
        Vista en Desarrollo
      </h2>

      {/* Descripción */}
      <p className="text-gray-500 text-center max-w-md text-lg">
        Estamos trabajando en este módulo. <br />
        Pronto podrás acceder a todas sus funcionalidades.
      </p>

      {/* Botón opcional de regreso (usando clases de tu design system si quisieras) */}
      <div className="mt-8">
        <button 
          onClick={() => window.history.back()}
          className="px-6 py-2 text-sm font-medium text-brand-action border border-brand-action rounded-lg hover:bg-brand-action hover:text-white transition-colors"
        >
          Volver atrás
        </button>
      </div>
    </div>
  );
};

export default Placeholder;
