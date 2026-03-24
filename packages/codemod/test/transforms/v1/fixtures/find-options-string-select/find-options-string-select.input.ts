const users = await repository.find({
    select: ["id", "name", "email"],
})
