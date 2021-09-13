import { ApiCallResponse } from './model'

export class OneBotError extends Error {}

export class TimeoutError extends OneBotError {
  constructor(message: string, public timeout?: number) {
    super(message)
  }
}

export class ActionError extends OneBotError {
  constructor(public data: ApiCallResponse) {
    super(data.status)
  }
}

export class NotAvailableError extends OneBotError {}
