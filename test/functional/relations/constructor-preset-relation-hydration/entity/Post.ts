import { Column } from "../../../../../src/decorator/columns/Column"
import { Entity } from "../../../../../src/decorator/entity/Entity"
import { PrimaryGeneratedColumn } from "../../../../../src/decorator/columns/PrimaryGeneratedColumn"
import { ManyToOne } from "../../../../../src/decorator/relations/ManyToOne"
import { JoinColumn } from "../../../../../src/decorator/relations/JoinColumn"
import { Author } from "./Author"

@Entity()
export class Post {
    constructor() {
        // Sensible default for "create" flows - see issue #12683.
        this.author = new Author()
    }

    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string

    @ManyToOne(() => Author)
    @JoinColumn()
    author: Author
}
