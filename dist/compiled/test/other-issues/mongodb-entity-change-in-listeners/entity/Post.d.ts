export declare class Post {
    id: number;
    title: string;
    active: boolean;
    updateDate: Date;
    beforeUpdate(): Promise<void>;
    loaded: Boolean;
    afterLoad(): Promise<void>;
}
