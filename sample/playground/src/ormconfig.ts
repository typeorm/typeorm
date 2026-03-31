import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entity/User.js"

export const AppDataSource = new DataSource({
    type: "sqljs",
    synchronize: true,
    logging: true,
    entities: [User],
})
