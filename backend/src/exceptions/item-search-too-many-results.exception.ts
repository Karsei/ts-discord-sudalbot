export class ItemSearchTooManyResultsError extends Error {
  private readonly _pagination: any;
  private readonly _result: any[];

  constructor(message: string, pagination: any, result: any[]) {
    super(message);
    this._pagination = pagination;
    this._result = result;
    Object.setPrototypeOf(this, ItemSearchTooManyResultsError.prototype);
  }

  get pagination() {
    return this._pagination;
  }

  get result() {
    return this._result;
  }
}
