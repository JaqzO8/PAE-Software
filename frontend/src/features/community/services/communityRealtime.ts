import { io } from 'socket.io-client';

export function connectCommunity(communityId: string, handlers: { changed: () => void; revoked: () => void; status: (online: boolean) => void }) {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const origin = apiUrl.startsWith('http') ? apiUrl.replace(/\/api\/?$/, '') : window.location.origin;
  const socket = io(origin, { path: '/community-socket', transports: ['websocket'], auth: callback => callback({ token: localStorage.getItem('token') }) });
  socket.on('connect', () => {
    socket.emit('community:subscribe', { communityId }, (response: { success: boolean }) => {
      handlers.status(response.success);
      if (response.success) handlers.changed();
      else { handlers.revoked(); socket.disconnect(); }
    });
  });
  socket.on('community:changed', handlers.changed);
  socket.on('community:access-revoked', handlers.revoked);
  socket.on('disconnect', reason => { handlers.status(false); if (reason === 'io server disconnect') handlers.revoked(); });
  socket.on('connect_error', () => handlers.status(false));
  return () => { socket.removeAllListeners(); socket.disconnect(); };
}
