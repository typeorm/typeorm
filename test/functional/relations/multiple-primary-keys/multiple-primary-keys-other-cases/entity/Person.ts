import { Entity } from "typeorm/decorator/entity/Entity"
import { Column } from "typeorm/decorator/columns/Column"
import { OneToOne } from "typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "typeorm/decorator/relations/JoinColumn"
import { User } from "./User"
import { PrimaryColumn } from "typeorm"

@Entity()
export class Person {
    @PrimaryColumn()
    userId: number

    @Column()
    fullName: string

    @OneToOne((type) => User)
    @JoinColumn()
    user: User
}
