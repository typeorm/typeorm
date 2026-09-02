import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { OneToMany } from "../../../../../src/decorator/relations/OneToMany"
import { OneToOne } from "../../../../../src/decorator/relations/OneToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { Category } from "./Category"
import { Author } from "./Author"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @OneToMany(() => Category, (category) => category.post, { eager: true })
    categories: Category[]

    @OneToOne(() => Author, { eager: true })
    @JoinColumn()
    author: Author
}
