/**
 * This class stores up and down queries needed for migrations functionality.
 */
export class SqlInMemory {
    upQueries: string[] = [];
    downQueries: string[] = [];
}