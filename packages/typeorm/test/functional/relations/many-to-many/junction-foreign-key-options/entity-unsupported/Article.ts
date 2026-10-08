import {
    Entity,
    JoinTable,
    ManyToMany,
    PrimaryGeneratedColumn,
} from "../../../../../../src"
import { Tag } from "./Tag"

@Entity()
export class Article {
    @PrimaryGeneratedColumn()
    id: number

    /**
     * RESTRICT is not supported by Oracle. The validator must reject it
     * in the same way as it rejects it on the relation options.
     */
    @ManyToMany(() => Tag)
    @JoinTable({
        joinColumn: { onDelete: "RESTRICT" },
    })
    tags: Tag[]
}
