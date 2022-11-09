export class ItemSearchError extends Error {
    constructor(...params: any) {
        super(...params);
        Object.setPrototypeOf(this, ItemSearchError.prototype);
    }
}
