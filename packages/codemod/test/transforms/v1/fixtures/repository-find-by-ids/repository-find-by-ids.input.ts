import { In } from "typeorm"

const users = await repository.findByIds([1, 2, 3])

// Should NOT be transformed — not a TypeORM repository method
const values = await service.findByIds(ctx, ids)
