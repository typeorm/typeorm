import {Column, Entity, ManyToMany, PrimaryGeneratedColumn} from "../../../../src"
import {Author} from "./Author";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @ManyToMany(() => Author, author => author.posts)
    authors: Author[]
}
