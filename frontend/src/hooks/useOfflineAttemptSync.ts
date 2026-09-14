import { useEffect } from "react";
import { syncOfflineAttempts } from "../features/learning/services/learningService";
import { getOfflineAttempts } from "../features/learning/services/offlineAttempts";
import { useToast } from "./useToast";

export const useOfflineAttemptSync = () => {
  const { toast } = useToast();

  useEffect(() => {
    const sync = async () => {
      const queued = await getOfflineAttempts();
      if (!navigator.onLine || queued.length === 0) return;
      const synced = await syncOfflineAttempts();
      if (synced.length > 0) {
        toast({
          title: "Intentos sincronizados",
          description: `${synced.length} envio(s) offline fueron enviados correctamente.`,
        });
      }
    };

    sync();
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
  }, [toast]);
};
