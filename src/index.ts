import { bot } from './bot'
import './handler'

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request))
})

async function handleRequest(request: Request) {
  try {
    const url = new URL(request.url)
    switch (url.pathname) {
      case '/ws':
        return websocketHandler(request)
      default:
        return new Response('Not found', { status: 404 })
    }
  } catch (err) {
    return new Response(String(err), { status: 500 })
  }
}

async function websocketHandler(request: Request) {
  const upgradeHeader = request.headers.get('Upgrade')
  const selfId = request.headers.get('X-Self-ID')

  if (!upgradeHeader?.includes('websocket'))
    return new Response('Expected upgrade: websocket', { status: 426 })

  if (selfId === null || isNaN(+selfId))
    return new Response('Expected X-Self-ID header', { status: 400 })

  const [client, server] = Object.values(new WebSocketPair())

  server.accept()
  await bot.bindWs(server)

  return new Response(null, {
    status: 101,
    webSocket: client,
  })
}
