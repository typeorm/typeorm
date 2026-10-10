import { Entity } from "../../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { OneToOne } from "../../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../../src/decorator/relations/JoinColumn"
import { Profile } from "./Profile"

@Entity()
export class Customer {
    @PrimaryGeneratedColumn()
    id: number

    @OneToOne(() => Profile)
    @JoinColumn()
    profile: Profile
}
