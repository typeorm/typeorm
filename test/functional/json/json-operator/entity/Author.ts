import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

export type Translations = {
    fr: string
    en: string
}

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column({
        type: "jsonb",
    })
    name: Translations
}
