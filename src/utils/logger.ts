/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
export type LogDrain = (message: LogData) => void | Promise<void>

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error'

export interface LogData {
  level: LogLevel
  message: string
  time: number
  name: string
  extra: Record<string, unknown>
}

export class Logger {
  public readonly drains = new Map<string, LogDrain>()

  constructor(
    public readonly name: string,
    protected readonly extra?: Record<string, unknown>,
  ) {}

  public log(level: LogLevel, message: string, extra: Record<string, unknown>) {
    void Promise.all(
      [...this.drains.values()].map((d) =>
        Promise.resolve(
          d({
            level,
            message,
            name: this.name,
            time: Date.now(),
            extra: { ...this.extra, ...extra },
          }),
        )
          .then(() => void null)
          .catch(() => void null),
      ),
    )
  }

  get trace() {
    return this.log.bind(this, 'trace')
  }

  get debug() {
    return this.log.bind(this, 'debug')
  }

  get info() {
    return this.log.bind(this, 'info')
  }

  get warn() {
    return this.log.bind(this, 'warn')
  }

  get error() {
    return this.log.bind(this, 'error')
  }

  public addDrain(name: string, drain: LogDrain) {
    this.drains.set(name, drain)
  }

  public removeDrain(name: string) {
    this.drains.delete(name)
  }
}

export const logger = new Logger('worker')

logger.addDrain('console', ({ level, message, time, extra }) =>
  console[level](`[${new Date(time).toISOString()}] ${message}`, extra),
)
