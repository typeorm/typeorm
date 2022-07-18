import { Column } from "../typeorm/decorator/columns/Column"
import { Entity } from "../typeorm/decorator/entity/Entity"
import { Profile } from "./Profile"
import { OneToOne } from "../typeorm/decorator/relations/OneToOne"
import { PrimaryColumn } from "../typeorm"

@Entity()
export class User {
    @PrimaryColumn()
    id: number

    @Column()
    name: string

    @OneToOne((type) => Profile, (profile) => profile.user, {
        cascade: ["insert"],
    })
    profile: Profile
}
