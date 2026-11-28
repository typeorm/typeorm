import { Column, Entity, PrimaryColumn } from "../../../../../src"

@Entity()
export class Author {
    @PrimaryColumn()
    id: number

    @Column()
    name: string
}
