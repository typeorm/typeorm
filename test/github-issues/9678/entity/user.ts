import { Entity, OneToMany, PrimaryGeneratedColumn } from "../../../../src"
import { Photo } from "./photo"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @OneToMany(() => Photo, (photo) => photo.user)
    photos: Photo[]
}
