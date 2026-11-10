import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryColumn } from "../../../../../../src/decorator/columns/PrimaryColumn"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Profile } from "./Profile"

@Entity()
export class Account {
    @PrimaryColumn()
    code: string

    @OneToOne(() => Profile, { lazy: true, createForeignKeyConstraints: false })
    @JoinColumn({ name: "code", referencedColumnName: "code" })
    profile: Promise<Profile>
}
