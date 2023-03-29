export interface EntitySchemaUniqueOptions {
    /**
     * Unique constraint name.
     */
    name?: string;
    /**
     * Unique column names.
     */
    columns?: ((object?: any) => (any[] | {
        [key: string]: number;
    })) | string[];
}
