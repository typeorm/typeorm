import { Entity, PrimaryColumn, Column } from "../../../../../src"

export class AuthorId {
    constructor(public readonly value: string) {}
}

@Entity()
export class Author {
    @PrimaryColumn({
        type: "varchar",
        length: 255,
        transformer: {
            from(value: string) {
                return new AuthorId(value)
            },
            to(id: AuthorId) {
                return id.value
            },
        },
    })
    id!: AuthorId

    @Column()
    name!: string
}
