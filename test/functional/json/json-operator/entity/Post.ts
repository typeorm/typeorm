import { Column, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "../../../../../src"
import { Author } from "./Author";

export type Translations = {
    fr: string;
    en: string;
}

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @Column({
        type: "jsonb",
        default: { name: "TypeScript" },
    })
    category: Translations

    @OneToOne(type => Author, {nullable: true})
    @JoinColumn()
    author:Author;

    @OneToMany(type => Author, author => author.post)
    authorsOneToMany:Author[];

    @ManyToOne(type => Author, {nullable: true})
    authorsManyToOne:Author;

    @ManyToMany(type => Author, {nullable: true})
    authorsManyToMany:Author[];

}
