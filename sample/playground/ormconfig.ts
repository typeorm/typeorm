import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./src/entity/User"

export default new DataSource({
    type: "sqljs",
    synchronize: true,
    logging: true,
    entities: [User],
})
