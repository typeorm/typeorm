import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Author } from "./Author"

@Entity()
export class Profile {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    bio: string

    @OneToOne(() => Author, { eager: true })
    @JoinColumn()
    author: Author
}
