import { User } from "./entity/user"
import { TestEntity } from "./entity/test.entity"
import path from "path"
import { setupSingleTestingConnection } from "../../utils/test-utils"

const migrationsDir = path.join(__dirname, "../migration")

export default setupSingleTestingConnection("postgres", {
    logging: false,
    migrations: [`${migrationsDir}/*{.ts,.js}`],
    entities: [TestEntity, User],
})
