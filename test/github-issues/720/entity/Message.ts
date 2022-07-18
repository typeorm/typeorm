import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "typeorm/decorator/entity/Entity"

@Entity()
export class Message {
    @PrimaryGeneratedColumn("increment", { type: "bigint" })
    id: string
}
