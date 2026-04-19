import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number

    @Column("varchar", { length: "50", nullable: true })
    title: string | null

    @Column("varchar", { length: "50", nullable: true })
    excerpt: string | null

    @Column("int", { nullable: true })
    viewCount: number | null

    @Column("numeric", { precision: 10, scale: 2, nullable: true })
    price: string | null
}
