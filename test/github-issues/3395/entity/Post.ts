import { PrimaryColumn, Entity, Column } from "typeorm"

@Entity()
export class Post {
    @PrimaryColumn()
    id: number

    @Column({
        nullable: true,
        transformer: {
            from(val: string | undefined | null) {
                return val === null ? "This is null" : val
            },
            to(val: string | undefined | null) {
                return val
            },
        },
    })
    text: string
}
