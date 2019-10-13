export declare class File {
    id: number;
    name: string;
    parentId: number;
    parent: File;
    children: File[];
    created: Date;
    modified: Date;
}
