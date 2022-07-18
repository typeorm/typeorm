import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity({ name: "users", synchronize: false })
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: number
}
