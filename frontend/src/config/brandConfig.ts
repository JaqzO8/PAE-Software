export const BRAND_CONFIG = {
  // Nombre de la marca
  name: 'PAE',
  fullName: 'Plataforma de Apoyo Estudiantil',
  
  // Logos (rutas relativas a /public)
  logo: {
    icon: '/logo-icon.svg',  // Logo cuadrado para sidebar
    full: '/logo-full.svg',   // Logo completo con texto
    fallbackIcon: 'P',        // Letra de fallback
  },

  // Colores principales (usar variables CSS)
  colors: {
    primary: 'hsl(var(--brand-action))',
    contrast: 'hsl(var(--primary-contrast))',
    success: 'hsl(var(--success-progress))',
  },

  // URLs y enlaces
  social: {
    instagram: 'https://instagram.com/pae_edu',
    facebook: 'https://facebook.com/pae_edu',
  },

  // Metadata para SEO
  meta: {
    title: 'PAE - Plataforma de Apoyo Estudiantil',
    description: 'Prepárate para el examen de admisión con recursos, simulacros y comunidad',
    keywords: ['educación', 'admisión', 'simulacros', 'perú'],
  },
} as const;

// Tipo para autocompletado
export type BrandConfig = typeof BRAND_CONFIG;

// Helper para obtener el nombre según contexto
export const getBrandName = (variant: 'short' | 'full' = 'short') => {
  return variant === 'short' ? BRAND_CONFIG.name : BRAND_CONFIG.fullName;
};