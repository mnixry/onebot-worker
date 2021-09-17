import { ApiCallRequest, ApiCallResponse, Event } from './model'
import { EventBus } from './bus'
import { Future } from '../utils/future'
import { ActionError, NotAvailableError, TimeoutError } from './errors'
import { Message } from './message'

export interface BotConfig {
  timeout: number
}

export type EventListener<E extends Event = Event> = (event: E) => Promise<void>

export class OneBotWorker {
  protected ws: WorkerWebSocket | undefined
  protected sequence = 0
  protected readonly bus = new EventBus<EventListener>()
  protected readonly futures = new Map<number, Future<ApiCallResponse>>()

  constructor(protected readonly configs: BotConfig) {}

  protected getSequence(): number {
    return this.sequence++
  }

  async bindWs(ws: WorkerWebSocket): Promise<void> {
    ws.addEventListener('message', async ({ data }) => {
      try {
        await this.handleEvent(JSON.parse(data))
      } catch (e) {
        ws.send(JSON.stringify({ error: String(e), time: Date.now() }))
      }
    })
    ws.addEventListener('close', console.error)
    this.ws = ws
  }

  on(callback: EventListener, ...name: string[]): void {
    name.forEach((n) => this.bus.subscribe(n, callback))
  }

  onMessage(callback: EventListener): void {
    this.on(callback, 'message')
  }

  onNotice(callback: EventListener): void {
    this.on(callback, 'notice')
  }

  onRequest(callback: EventListener): void {
    this.on(callback, 'request')
  }

  onMetaEvent(callback: EventListener): void {
    this.on(callback, 'meta_event')
  }

  async callApi(api: string, params?: Record<string, any>): Promise<any> {
    const seq = this.getSequence()
    const future = new Future<ApiCallResponse>()
    const payload: ApiCallRequest<unknown> = { action: api, params, echo: seq }
    if (!this.ws) throw new NotAvailableError('Websocket connection is not up.')

    this.futures.set(seq, future)
    this.ws.send(JSON.stringify(payload))
    future.finally(() => this.futures.delete(seq))
    Future.sleep(this.configs.timeout || 60).then(() =>
      future.setError(
        new TimeoutError('timeout reached', this.configs.timeout),
      ),
    )

    const result = await future
    if (result.status === 'failed') throw new ActionError(result)
    return result.data
  }

  async handleEvent(data: Event | ApiCallResponse): Promise<void> {
    if ('post_type' in data) {
      const event = new Event(data)
      const date = new Date(data.time).toISOString()
      console.log(`[${date}] Received event "${event.name}":`, event)
      await this.bus.emit(event.name, event)
    } else if (data.echo) {
      if (this.futures.has(data.echo))
        this.futures.get(data.echo)?.setResult(data)
    } else {
      console.warn('Unidentified websocket message', data)
    }
  }

  async send(event: Event, message: Message): Promise<void> {
    const type = 'group_id' in event ? 'group_id' : 'user_id'
    const params = { message, [type]: event[type] }
    return await this.callApi('send_msg', params)
  }
}

export const bot = new OneBotWorker({ timeout: 30 })
