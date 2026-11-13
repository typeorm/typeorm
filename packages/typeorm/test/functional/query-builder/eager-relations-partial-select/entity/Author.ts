import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "../../../../../src/decorator/columns/Column"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { Profile } from "./Profile"

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    email: string

    @ManyToOne(() => Profile, { eager: true })
    profile: Profile
}
