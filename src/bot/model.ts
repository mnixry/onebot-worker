export type PostTypes = 'message' | 'notice' | 'request' | 'meta_event'

export interface BotEvent extends Record<string, unknown> {
  time: number
  name: string
  self_id: number
  post_type: PostTypes | string
  sub_type?: string
}

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
