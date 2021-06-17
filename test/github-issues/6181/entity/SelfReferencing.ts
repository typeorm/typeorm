export class SelfReferencing {
    constructor(value: string) {
        this.value = value;
        this.self = this;
    }

    value: string;

    self: SelfReferencing;
}
