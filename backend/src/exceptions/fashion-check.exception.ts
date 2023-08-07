export class FashionCheckError extends Error {
  constructor(...params: any) {
    super(...params);
    Object.setPrototypeOf(this, FashionCheckError.prototype);
  }
}
