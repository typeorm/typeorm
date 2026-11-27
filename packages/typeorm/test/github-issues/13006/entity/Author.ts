import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../src"
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
