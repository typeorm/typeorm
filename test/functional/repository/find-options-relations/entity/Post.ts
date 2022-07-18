import { Entity } from "typeorm/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "typeorm/decorator/columns/PrimaryGeneratedColumn"
import { Column } from "typeorm/decorator/columns/Column"
import { ManyToMany } from "typeorm/decorator/relations/ManyToMany"
import { JoinTable } from "typeorm/decorator/relations/JoinTable"
import { OneToMany } from "typeorm/decorator/relations/OneToMany"
import { Category } from "./Category"
import { User } from "./User"
import { Photo } from "./Photo"
import { ManyToOne } from "typeorm/decorator/relations/ManyToOne"
import { Counters } from "./Counters"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToMany((type) => Photo, (photo) => photo.post)
    photos: Photo[]

    @ManyToOne((type) => User)
    user: User

    @ManyToMany((type) => Category)
    @JoinTable()
    categories: Category[]

    @Column((type) => Counters)
    counters: Counters
}
