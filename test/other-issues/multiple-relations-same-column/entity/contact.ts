import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from "../../../../src"
import { User } from "./user"

@Entity("contacts")
export class Contact {
    @PrimaryColumn()
    id: number

    @Column()
    createdById: number

    @ManyToOne(() => User)
    @JoinColumn({ name: "createdById" })
    createdBy: User

    @Column()
    updatedById: number

    @ManyToOne(() => User)
    @JoinColumn({ name: "updatedById" })
    updatedBy: User
}
