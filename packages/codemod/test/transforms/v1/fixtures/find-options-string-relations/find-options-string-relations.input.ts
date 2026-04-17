import "typeorm"

const users = await repository.find({
    relations: ["profile", "posts", "posts.comments"],
})
