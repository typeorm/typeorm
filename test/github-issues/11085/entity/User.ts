import { PrimaryGeneratedColumn } from "../../../../src"
import { Column } from "../../../../src/decorator/columns/Column"
import { Entity } from "../../../../src/decorator/entity/Entity"

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    isActive: boolean
}
