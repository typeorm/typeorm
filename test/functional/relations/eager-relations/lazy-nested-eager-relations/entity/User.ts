import { Entity } from "../typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../typeorm/decorator/columns/Column"
import { OneToOne } from "../typeorm/decorator/relations/OneToOne"
import { JoinColumn } from "../typeorm/decorator/relations/JoinColumn"
import { Profile } from "./Profile"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @OneToOne((type) => Profile, { eager: true })
    @JoinColumn()
    profile: Profile
}
