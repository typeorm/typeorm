import { Column } from "../../../../../../src/decorator/columns/Column"
import { ChildEntity } from "../../../../../../src/decorator/entity/ChildEntity"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Contributor } from "./Contributor"
import { Profile } from "./Profile"

@ChildEntity()
export class User extends Contributor {
    @Column()
    email: string

    @OneToOne(() => Profile, { eager: true })
    @JoinColumn()
    profile: Profile
}
