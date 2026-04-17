import "typeorm"

await queryBuilder.setLock("pessimistic_partial_write").getMany()
await queryBuilder.setLock("pessimistic_write_or_fail").getMany()

// Find options form
const users = await repository.find({
    where: { id: 1 },
    lock: { mode: "pessimistic_partial_write" },
})
