declare interface ResponseInit {
  webSocket?: WebSocket
}

declare interface WorkerWebSocket extends WebSocket {
  accept(): void
  close(code?: number, reason?: string): void
  send(message: string): void
}

declare class WebSocketPair extends Array<WorkerWebSocket> {}
