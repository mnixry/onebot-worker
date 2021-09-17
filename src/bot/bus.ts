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

  protected async gather(args: any[], ...funcs: C[]) {
    let succeed = 0
    await Promise.all(
      funcs.map(
        async (f) =>
          await f(...args)
            .then(() => succeed++)
            .catch((err) =>
              console.error('Error occurred while handling event:', err),
            ),
      ),
    )
    return { total: funcs.length, succeed, failed: funcs.length - succeed }
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
      const { failed, succeed, total } = await this.gather(
        args,
        ...this.subscribers.get(currentEvent),
      )
      console.log(
        `Event bus for event "${currentEvent}" completed, ` +
          `total=${total} failed=${failed} succeed=${succeed}`,
      )
    }
  }
}
