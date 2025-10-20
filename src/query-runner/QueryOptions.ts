/**
 * Options that can be passed to raw query execution methods like DataSource.query, EntityManager.query and QueryRunner.query.
 */
export interface QueryOptions {
    /**
     * When true, the database driver's raw structured result (with metadata about multiple result sets, etc.)
     * is returned instead of the default simplified array / value.
     */
    useStructuredResult?: boolean
}
