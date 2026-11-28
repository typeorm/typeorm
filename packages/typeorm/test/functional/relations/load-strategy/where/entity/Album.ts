import {
    Column,
    Entity,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Photo } from "./Photo"
import { User } from "./User"

@Entity()
export class Album {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToOne(() => User)
    user: User

    @OneToMany(() => Photo, (photo) => photo.album)
    photos: Photo[]
}
