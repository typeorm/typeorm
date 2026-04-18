import "typeorm"

await queryBuilder
    .setLock("pessimistic_write")
    .setOnLocked("skip_locked")
    .getMany()
await queryBuilder.setLock("pessimistic_write").setOnLocked("nowait").getMany()

// Find options form — skip_locked variant
const skipLockedUsers = await repository.find({
    where: { id: 1 },
    lock: {
        mode: "pessimistic_write",
        onLocked: "skip_locked",
    },
})

// Find options form — nowait variant
const nowaitUsers = await repository.find({
    where: { id: 2 },
    lock: {
        mode: "pessimistic_write",
        onLocked: "nowait",
    },
})
