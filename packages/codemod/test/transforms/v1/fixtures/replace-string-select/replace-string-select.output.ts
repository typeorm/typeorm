const users = await repository.find({
    select: {
        id: true,
        name: true,
        email: true,
    },
})
