const hasUsers = await userRepository.exist({ where: { isActive: true } })
