import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
} from "../../../../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { length: "255" })
    title: string

    @Column("int")
    views: number

    @Column("bigint")
    score: number

    @Column("enum", { enum: ["draft", "published", "archived"] })
    status: string

    @Column("varchar", { length: "100", nullable: true })
    subtitle: string | null

    @Column("double")
    rating: number

    @Column({ type: "varchar", length: "50", charset: "utf8mb3" })
    tag: string

    @Column("set", { enum: ["read", "write", "admin"], default: ["read"] })
    flags: string
}
