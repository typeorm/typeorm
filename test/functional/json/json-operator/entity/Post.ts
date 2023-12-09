import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

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
}
