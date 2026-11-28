import {
    Column,
    Entity,
    Generated,
    OneToMany,
    PrimaryColumn,
} from "../../../../src"
import { prefixedIdTransformer } from "../transformer"
import { Book } from "./Book"

@Entity()
export class Author {
    @Generated("increment")
    @PrimaryColumn({ type: "integer", transformer: prefixedIdTransformer })
    id: string

    @Column()
    name: string

    @OneToMany(() => Book, (book) => book.author, { cascade: ["insert"] })
    books: Book[]
}
