import { Photo } from "./photo"
import {
    Column,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "../../../../src"

@Entity()
export class Tag {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    value: string

    @ManyToOne(() => Photo, (photo) => photo.tags)
    photo: Photo
}
