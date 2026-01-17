import {
    Column,
    Entity,
    Index,
    PrimaryGeneratedColumn,
} from "../../../../../../src"

@Entity()
@Index("IDX_INVALID_POST_RATING_DESC", ["rating"], {
    columnOptions: {
        rating: { order: "DESC", nulls: "NULLS LAST" },
        extraColumn: { order: "ASC" }, // Invalid extra column not in the index
    },
})
export class InvalidPost {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ nullable: true })
    rating: number

    @Column({ nullable: true })
    extraColumn: string
}
