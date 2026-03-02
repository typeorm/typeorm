import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { Actor } from "./Actor"
import { User } from "./User"

@ChildEntity()
export class Organization extends Actor {
    @Column()
    industry: string

    @OneToMany(() => User, (user) => user.employer)
    members: User[]

    @ManyToOne(() => User, { nullable: true })
    ceo: User
}
