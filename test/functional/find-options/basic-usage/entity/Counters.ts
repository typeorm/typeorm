import { Column, JoinTable, ManyToMany } from "typeorm"
import { Author } from "./Author"

export class Counters {
    @Column()
    likes: number

    @ManyToMany(() => Author)
    @JoinTable()
    likedUsers: Author[]
}
