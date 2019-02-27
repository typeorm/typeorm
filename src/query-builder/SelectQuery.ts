export interface SelectQuery {
    selection: string;
    columnPath?: string;
    aliasName?: string;
    virtual?: boolean;
}