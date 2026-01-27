import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class Article {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string
}
