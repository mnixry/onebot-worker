export interface ResolveCallback<T> {
  (value: T | PromiseLike<T>): void
}

export interface RejectCallback {
  (reason?: any): void
}

export class Future<T = void> extends Promise<T> {
  public setResult!: ResolveCallback<T>
  public setError!: RejectCallback

  constructor(
    executor?: (resolve: ResolveCallback<T>, reject: RejectCallback) => void,
  ) {
    super(
      executor ||
        ((resolve, reject) => {
          this.setResult = resolve
          this.setError = reject
        }),
    )
  }

  static sleep(ms: number): Future<void> {
    const future = new Future<void>()
    setTimeout(() => future.setResult(), ms)
    return future
  }
}

export default Future
