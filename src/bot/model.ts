import { Message } from './message'

export type PostTypes = 'message' | 'notice' | 'request' | 'meta_event'

export interface ApiCallResponse {
  status: string
  retcode: number
  echo: number
  data: null | Record<string, unknown>
}

export interface ApiCallRequest<P = null> {
  action: string
  params?: P
  echo: number
}

export class Event implements Record<string, unknown> {
  time!: number
  self_id!: number
  post_type!: PostTypes | string;

  [key: string]: unknown

  constructor(event: Record<string, unknown>) {
    for (const key in event) this[key] = event[key]
    if (this.type === 'message') {
      this.message = new Message(event.message as any)
      this.raw_message = event.message
    }
  }

  get type(): PostTypes | string {
    return this.post_type
  }

  get detail_type(): string {
    return this[`${this.type}_type`] as string
  }

  sub_type?: string

  get name(): string {
    return (
      `${this.type}.${this.detail_type}` +
      (this.sub_type ? '.' + this.sub_type : '')
    )
  }

  user_id?: number
  operator_id?: number
  group_id?: number
  discuss_id?: number
  message_id?: number
  message?: Message
  raw_message?: unknown
  sender?: Record<string, unknown>
  anonymous?: Record<string, unknown>
  file?: Record<string, unknown>
  comment?: string
  flag?: string
}
