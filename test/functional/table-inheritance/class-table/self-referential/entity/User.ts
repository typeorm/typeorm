import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { ManyToOne } from "../../../../../../src/decorator/relations/ManyToOne"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { Actor } from "./Actor"

@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @ManyToOne(() => User, (user) => user.directReports, { nullable: true })
    manager: User

    @OneToMany(() => User, (user) => user.manager)
    directReports: User[]
}
