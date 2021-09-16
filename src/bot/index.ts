import { ApiCallRequest, ApiCallResponse, BotEvent } from './model'
import { EventBus } from './bus'
import { Future } from '../utils/future'
import { ActionError, NotAvailableError, TimeoutError } from './errors'

export interface BotConfig {
  timeout: number
}

export type EventListener<E extends BotEvent = BotEvent> = (
  event: E,
) => Promise<void>

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

  async handleEvent(event: BotEvent | ApiCallResponse): Promise<void> {
    if ('post_type' in event) {
      const eventType =
        `${event.post_type}.` +
        event[`${event.post_type}_type`] +
        (event.sub_type ? `.${event.sub_type}` : '')
      event.name = eventType
      console.log(`Received event "${eventType}":`, event)
      await this.bus.emit(event.name, event)
    } else if (event.echo) {
      if (this.futures.has(event.echo))
        this.futures.get(event.echo)?.setResult(event)
    } else {
      console.error('Unidentified websocket message', event)
    }
  }

  async send(event: BotEvent, message: Array<any> | string): Promise<void> {
    const type = 'group_id' in event ? 'group_id' : 'user_id'
    const params = { message, [type]: event[type] }
    return await this.callApi('send_msg', params)
  }
}

export const bot = new OneBotWorker({ timeout: 30 })
