declare const type: unique symbol

export class PostId {
    [type]: true
    constructor(public readonly value: string) {}
}
