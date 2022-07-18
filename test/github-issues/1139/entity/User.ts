import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string
}
