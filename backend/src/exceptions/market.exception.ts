export class MarketError extends Error {
  constructor(...params: any) {
    super(...params);
    Object.setPrototypeOf(this, MarketError.prototype);
  }
}
