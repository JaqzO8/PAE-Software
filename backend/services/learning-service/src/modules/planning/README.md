# Planificación — Juan

Puerto de entrada de agenda, preferencias, sesiones, recordatorios y misiones diarias. La vertical usa `domain`, `application`, `infrastructure` e interfaces HTTP; persiste en el esquema `planning` de `learning-service` mediante `002_planning.sql`, sin copiar modelos de Contenido ni iniciar otro servidor. Consume `LeccionCompletada.v1` mediante contrato validado y mantiene la proyección de progreso sin escribir de vuelta en Contenido.
Las transiciones de Pomodoro se validan server-side y se registran en `planning.pomodoro_sessions`; el historial no altera el progreso académico.
