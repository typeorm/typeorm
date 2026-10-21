import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryGeneratedColumn,
} from "../../../../../src"
import { Photo } from "./Photo"

@Entity()
export class PostWithInsertOnly {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToOne(() => Photo, {
        cascade: ["insert"],
    })
    @JoinColumn()
    photo: Photo
}
