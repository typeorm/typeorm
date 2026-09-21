import { TypeORMError } from "./TypeORMError"

/**
 * Thrown when consumer tries to access repository before connection is established.
 */
export class NoConnectionForRepositoryError extends TypeORMError {
    constructor(dataSourceName: string) {
        super(
            `Cannot get a Repository for the "${dataSourceName}" DataSource, because connection with the database ` +
                `is not established yet. Call dataSource#initialize method to establish connection.`,
        )
    }
}
