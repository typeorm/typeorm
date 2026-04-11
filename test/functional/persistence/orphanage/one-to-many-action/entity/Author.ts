import { Column } from "../../../../../../src/decorator/columns/Column"
import { PrimaryGeneratedColumn } from "../../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Entity } from "../../../../../../src/decorator/entity/Entity"
import { OneToMany } from "../../../../../../src/decorator/relations/OneToMany"
import { Article } from "./Article"

@Entity()
export class Author {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @OneToMany(() => Article, (article) => article.author, {
        cascade: ["insert"],
        eager: true,
        orphanedRowAction: "delete",
    })
    articles: Article[]

    constructor(name: string) {
        this.name = name
    }
}
