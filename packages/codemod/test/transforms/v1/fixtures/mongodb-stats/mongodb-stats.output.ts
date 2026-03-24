const stats =
    await // TODO: `stats()` was removed in TypeORM v1. Use the MongoDB driver directly. See migration guide: https://typeorm.io/docs/guides/migration-v1
    mongoRepository.stats()
