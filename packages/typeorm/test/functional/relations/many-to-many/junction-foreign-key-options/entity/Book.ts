import {
    Entity,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Author } from "./Author"

@Entity()
export class Book {
    @PrimaryGeneratedColumn()
    id: number

    /**
     * The inverse relation sets its own referential actions.
     * These win over the inverseJoinColumn options on the owner side.
     */
    @ManyToMany(() => Author, (author) => author.books, {
        onDelete: "NO ACTION",
        onUpdate: "NO ACTION",
        deferrable: "INITIALLY DEFERRED",
    })
    authors: Author[]
}
