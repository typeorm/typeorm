import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Photo } from "./Photo"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number

    @OneToMany((type) => Photo, (photo) => photo.user)
    photos: Photo[]
}
