// Repository form
const user = await repository.findOneById(1)

// EntityManager form
const user2 = await manager.findOneById(User, userId)

// BaseEntity form
const user3 = await User.findOneById(42)
