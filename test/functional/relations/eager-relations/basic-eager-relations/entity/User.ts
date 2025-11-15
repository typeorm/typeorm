import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../../src/decorator/columns/Column"
import { OneToOne } from "../../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../../src/decorator/relations/JoinColumn"
import { Profile } from "./Profile"
import { DeleteDateColumn, ManyToOne } from "../../../../../../src"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @OneToOne(() => Profile, { eager: true })
    @JoinColumn()
    profile: Profile

    @DeleteDateColumn()
    deletedAt?: Date

    @ManyToOne(() => Profile)
    nestedProfile: Profile
}
