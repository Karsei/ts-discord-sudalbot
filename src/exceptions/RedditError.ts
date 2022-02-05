class RedditError extends Error {
    constructor(...params: any) {
        super(...params);
        Object.setPrototypeOf(this, RedditError.prototype);
    }
}

export default RedditError;