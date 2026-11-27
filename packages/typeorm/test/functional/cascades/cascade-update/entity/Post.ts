import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Photo } from "./Photo"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne(() => Photo, (photo) => photo.post, {
        cascade: ["update"],
    })
    @JoinColumn()
    photo: Photo
}
