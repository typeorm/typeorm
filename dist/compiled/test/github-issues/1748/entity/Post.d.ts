export declare class Uuid {
    private value;
    constructor(value: string);
    getValue(): string;
}
export declare class Post {
    id: Uuid;
    title: string;
    constructor(id: Uuid);
}
