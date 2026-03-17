const users = await repository.findBy({
    id: In([1, 2, 3]),
})
