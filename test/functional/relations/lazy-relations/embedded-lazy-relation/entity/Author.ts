import { Column } from "../../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Profile } from "./Profile"

export class Author {
    @Column()
    name: string

    @OneToOne(() => Profile)
    @JoinColumn()
    profile: Promise<Profile>
}
