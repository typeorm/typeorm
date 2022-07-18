import { TableInheritance, Column, Entity } from "typeorm"
import { BaseEntity } from "./BaseEntity"

@Entity()
@TableInheritance({ column: { type: String, name: "type" } })
export abstract class User extends BaseEntity {
    @Column()
    firstName: string

    @Column()
    lastName: string
}
