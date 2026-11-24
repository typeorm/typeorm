import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Album } from "./Album"
import { User } from "./User"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => Album, (album) => album.photos)
    album: Album

    @ManyToOne(() => User)
    owner: User
}
