import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Actor } from "./Actor"
import { Profile } from "./Profile"

@ChildEntity()
export class User extends Actor {
    @Column()
    email: string

    @OneToOne(() => Profile, { lazy: true })
    @JoinColumn()
    profile: Promise<Profile>
}
