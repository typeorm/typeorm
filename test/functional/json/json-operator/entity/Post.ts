import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "../../../../../src"
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
}
