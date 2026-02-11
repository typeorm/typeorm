import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class ArticleCategory {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
