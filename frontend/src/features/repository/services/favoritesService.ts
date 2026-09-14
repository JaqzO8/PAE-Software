// src/features/repository/services/favoritesService.ts
// ⚠️ ESTE ARCHIVO YA NO ES NECESARIO
// Todas las funciones de favoritos están ahora en repositoryService.ts

// Para mantener compatibilidad, re-exportamos:
export { 
  getFavorites,
  checkFavorite,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite 
} from "./repositoryService";