const stats =
    await // TODO(typeorm-v1): `stats()` was removed — use the MongoDB driver directly
    mongoRepository.stats()
