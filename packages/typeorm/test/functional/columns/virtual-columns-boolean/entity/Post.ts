import {
    Column,
    Entity,
    PrimaryGeneratedColumn,
    VirtualColumn,
} from "../../../../../src"

@Entity({ name: "posts" })
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "varchar", nullable: true })
    attachment: string | null

    // the query is set per driver in the test, since identifier quoting differs
    @VirtualColumn({
        query: (alias) =>
            `CASE WHEN ${alias}.attachment IS NOT NULL THEN 1 ELSE 0 END`,
    })
    hasAttachment: boolean

    @VirtualColumn({ query: () => "CASE WHEN 1 = 1 THEN 1 ELSE 0 END" })
    alwaysTrue: boolean

    @VirtualColumn({ query: () => "CASE WHEN 1 = 0 THEN 1 ELSE 0 END" })
    alwaysFalse: boolean
}
