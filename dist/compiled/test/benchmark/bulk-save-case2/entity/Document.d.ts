export declare class Document {
    id: string;
    docId: string;
    label: string;
    context: string;
    distributions: Distribution[];
    date: Date;
}
export interface Distribution {
    weight: string;
    id: number;
    docId: number;
}
