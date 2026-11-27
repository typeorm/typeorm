import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { OneToOne } from "../../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { Unique } from "../../../../../../../src/decorator/Unique"
import { Profile } from "./Profile"

@Entity()
@Unique(["profile"])
export class Account {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne(() => Profile)
    @JoinColumn()
    profile: Profile
}
