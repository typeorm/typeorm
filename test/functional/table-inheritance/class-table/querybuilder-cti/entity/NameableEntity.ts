import { Column } from "../../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { AuthorizableEntity } from "./AuthorizableEntity"
import { Profile } from "./Profile"

export abstract class NameableEntity extends AuthorizableEntity {
    @Column("varchar", { length: 36 })
    nameID: string

    @OneToOne(() => Profile, {
        eager: false,
        cascade: true,
        onDelete: "SET NULL",
    })
    @JoinColumn()
    profile: Profile
}
