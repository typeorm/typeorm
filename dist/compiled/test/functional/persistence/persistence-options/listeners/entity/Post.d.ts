export declare class Post {
    id: number;
    title: string;
    description: string;
    isRemoved: boolean;
    beforeInsert(): void;
    afterRemove(): void;
}
