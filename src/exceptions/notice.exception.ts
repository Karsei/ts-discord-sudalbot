export class NoticeError extends Error {
    constructor(...params: any) {
        super(...params);
        Object.setPrototypeOf(this, NoticeError.prototype);
    }
}
