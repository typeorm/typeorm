import "typeorm"

// Repository form
const user = await repository.findOneBy({
    id: 1,
})

// EntityManager form
const user2 = await manager.findOneBy(User, {
    id: userId,
})

// BaseEntity form
const user3 = await User.findOneBy({
    id: 42,
})
