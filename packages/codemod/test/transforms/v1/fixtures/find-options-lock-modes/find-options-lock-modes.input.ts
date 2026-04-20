import "typeorm"

await queryBuilder.setLock("pessimistic_partial_write").getMany()
await queryBuilder.setLock("pessimistic_write_or_fail").getMany()

// Find options form — skip_locked variant
const skipLockedUsers = await repository.find({
    where: { id: 1 },
    lock: { mode: "pessimistic_partial_write" },
})

// Find options form — nowait variant
const nowaitUsers = await repository.find({
    where: { id: 2 },
    lock: { mode: "pessimistic_write_or_fail" },
})

// Existing `onLocked` siblings must not be duplicated
const preserved = await repository.find({
    lock: { mode: "pessimistic_write_or_fail", onLocked: "nowait" },
})

// Quoted `"mode"` and `"onLocked"` keys should match the same way identifiers do
// prettier-ignore
const quotedKeys = await repository.find({
    "lock": { "mode": "pessimistic_partial_write", "onLocked": "skip_locked" },
})
