import "typeorm"

const hasUsers = await userRepository.exists({ where: { isActive: true } })
