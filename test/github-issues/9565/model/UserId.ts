declare const type: unique symbol

export class UserId {
    [type]: true
    constructor(public readonly value: string) {}
}
