export interface IMessageSegment {
  type: string
  data: Record<string, unknown>
}

export function escape(message: string, escapeComma = true): string {
  const escaped = message
    .replace('&', '&amp;')
    .replace('[', '&#91;')
    .replace(']', '&#93;')
  return escapeComma ? escaped.replace(',', '&#44;') : escaped
}

export function unescape(message: string): string {
  return message
    .replace('&#44;', ',')
    .replace('&#91;', '[')
    .replace('&#93;', ']')
    .replace('&amp;', '&')
}

export class Message extends Array<MessageSegment> {
  constructor(message: IMessageSegment[] | IMessageSegment | string) {
    super()
    if (typeof message === 'string') {
      return Message.fromString(message)
    } else if (Array.isArray(message)) {
      const segments = message.map(
        ({ type, data }) => new MessageSegment(type, data),
      )
      super.push(...segments)
    } else {
      super.push(new MessageSegment(message.type, message.data))
    }
  }

  static fromString(message: string): IMessageSegment[] {
    const regex =
      /\[CQ:(?<type>[a-zA-Z0-9-_.]+)(?<params>(?:,[a-zA-Z0-9-_.]+=[^,\]]+)*),?\]/gm
    const segments: IMessageSegment[] = []

    let matched: RegExpExecArray | null = null
    let start = 0

    while ((matched = regex.exec(message)) !== null) {
      if (matched.index === regex.lastIndex) regex.lastIndex++ // * This is necessary to avoid infinite loops with zero-width matches
      if (start < matched.index)
        segments.push(
          MessageSegment.text(
            unescape(message.substring(start, matched.index)),
          ),
        )

      const { type, params } = matched.groups as {
        type: string
        params: string
      }
      const data = Object.fromEntries(
        params
          .split(',')
          .filter((param) => !!param.trim())
          .map((param) => param.trim().split('=', 2))
          .map(([key, value]) => [key, unescape(value || '')]),
      )
      segments.push(new MessageSegment(type, data))

      start = regex.lastIndex
    }

    if (start < message.length) {
      segments.push(
        MessageSegment.text(unescape(message.substring(start, message.length))),
      )
      start = message.length
    }

    return segments
  }

  public toString(): string {
    return this.map((segment) => segment.toString()).join('')
  }
}

export class MessageSegment implements IMessageSegment {
  constructor(public type: string, public data: Record<string, unknown>) {}

  public toString(): string {
    if (this.type === 'text') {
      return escape((this.data.text as string) || '', false)
    }
    const params =
      Object.values(this.data).length > 0
        ? ',' +
          Object.entries(this.data)
            .map(([key, value]) => `${key}=${escape(String(value))}`)
            .join(',')
        : ''
    return `[CQ:${this.type}${params}]`
  }

  static text(text: string): MessageSegment {
    return new MessageSegment('text', { text })
  }
}
