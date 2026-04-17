import "typeorm"

await queryBuilder
    .setLock("pessimistic_write")
    .setOnLocked("skip_locked")
    .getMany()
await queryBuilder.setLock("pessimistic_write").setOnLocked("nowait").getMany()

// Find options form
const users = await repository.find({
    where: { id: 1 },
    lock: {
        mode: "pessimistic_write",
        onLocked: "skip_locked",
    },
})
