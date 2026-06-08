export class DataLossPreventionError extends Error {
    constructor(columnName: string, oldType: string, newType: string) {
        super(`Potential data loss detected for column "${columnName}". Attempting to change ${oldType} to ${newType} without 'migrationsAllowLossyAlter' flag.`);
        this.name = 'DataLossPreventionError';
    }
}
