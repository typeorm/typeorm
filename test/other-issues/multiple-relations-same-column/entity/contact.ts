import { Column, Entity, ManyToOne, PrimaryColumn } from "../../../../src"
import { User } from "./user"

@Entity("contacts")
export class Contact {
    @PrimaryColumn()
    id: number

    @Column()
    createdById: number

    @ManyToOne(() => User)
    createdBy: User

    @Column()
    updatedById: number

    @ManyToOne(() => User)
    updatedBy: User
}
