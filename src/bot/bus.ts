export class DefaultMap<K, V> extends Map<K, V> {
  constructor(public readonly defaultFactory: () => V) {
    super()
  }
  get(key: K): V {
    if (!this.has(key)) {
      this.set(key, this.defaultFactory())
    }
    return super.get(key) as V
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Subscriber = (...args: any[]) => Promise<any>

export class EventBus<C extends Subscriber = Subscriber> {
  protected subscribers = new DefaultMap<string, Set<C>>(() => new Set<C>())

  protected rsplit(str: string, sep: string, maxSplit?: number): string[] {
    const split = str.split(sep)
    return maxSplit
      ? [split.slice(0, -maxSplit).join(sep)].concat(split.slice(-maxSplit))
      : split
  }

  subscribe(event: string, func: C): void {
    this.subscribers.get(event).add(func)
  }

  unsubscribe(event: string, func: C): void {
    if (this.subscribers.has(event) && this.subscribers.get(event).has(func))
      this.subscribers.get(event).delete(func)
  }

  async emit(event: string, ...args: any[]): Promise<void> {
    const segments = event.split('.')
    for (let i = 0; i < segments.length; i++) {
      const currentEvent = segments.slice(0, i + 1).join('.')
      console.log(`Event bus calling event "${currentEvent}"`)
      if (
        !this.subscribers.has(currentEvent) ||
        this.subscribers.get(currentEvent).size <= 0
      )
        continue
      for (const callback of this.subscribers.get(currentEvent)) {
        await callback(...args)
      }
    }
  }
}
