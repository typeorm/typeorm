import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "../../../../../src"
import { Post } from "./Post";

export type Translations = {
    fr: string;
    en: string;
}

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "jsonb",
    })
    name: Translations

    @ManyToOne(type => Post, {nullable: true})
    post: Post;
}
