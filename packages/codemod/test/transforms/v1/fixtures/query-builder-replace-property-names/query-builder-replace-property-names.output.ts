class MyQueryBuilder extends SelectQueryBuilder<any> {
    // TODO: `replacePropertyNames` was removed in TypeORM v1. This method override is no longer called. See migration guide: https://typeorm.io/docs/guides/migration-v1
    replacePropertyNames(query: string): string {
        return query
    }
}
