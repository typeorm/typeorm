await queryBuilder
    .setLock("pessimistic_write")
    .setOnLocked("skip_locked")
    .getMany()
await queryBuilder.setLock("pessimistic_write").setOnLocked("nowait").getMany()
