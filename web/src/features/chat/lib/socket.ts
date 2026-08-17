import { io, type Socket } from "socket.io-client";

// Browser-visible Socket.IO origin. In dev this points STRAIGHT at the API so
// the handshake does NOT go through the Next.js dev proxy — the dev proxy does
// not forward Socket.IO Engine.IO/polling/WebSocket reliably, which manifests
// as `connect_error: timeout` and breaks realtime. The socket authenticates via
// a Bearer token (not cookies), so cross-origin here is fine; the gateway CORS
// allow-list includes the web origin. Override via NEXT_PUBLIC_SOCKET_URL.
const SOCKET_ORIGIN =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5000";

export const CHAT_NAMESPACE = "/chat";
// Engine.IO path (NOT `/socket.io/socket.io.js` — that's the client file).
const ENGINE_PATH = "/socket.io";

let socket: Socket | null = null;

// Tiny external-store pub/sub so React can subscribe to socket lifecycle
// changes without keeping socket state (and setState calls) inside effects.
const listeners = new Set<() => void>();
function emitChange() {
  listeners.forEach((l) => l());
}

export function subscribeSocketListener(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getChatSocket(): Socket | null {
  return socket;
}

export function createChatSocket(token: string): Socket {
  return io(`${SOCKET_ORIGIN}${CHAT_NAMESPACE}`, {
    path: ENGINE_PATH,
    transports: ["websocket", "polling"],
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelayMax: 3000,
  });
}

/** Initialize (or reuse) the singleton socket for the given access token. */
export function initChatSocket(token: string): Socket {
  if (!socket || socket.disconnected) {
    socket = createChatSocket(token);
    socket.on("connect", emitChange);
    socket.on("disconnect", emitChange);
  }
  if (!socket.connected) socket.connect();
  emitChange();
  return socket;
}

export function disconnectChatSocket(): void {
  if (socket) {
    socket.off("connect", emitChange);
    socket.off("disconnect", emitChange);
    socket.disconnect();
    socket = null;
    emitChange();
  }
}

/** Join (or queue until connected) the private socket room of a conversation. */
export function joinConversationRoom(sock: Socket, conversationId: string) {
  const emit = () => sock.emit("joinConversation", { conversationId });
  if (!sock.connected) {
    sock.once("connect", emit);
    sock.connect();
  } else {
    emit();
  }
}
