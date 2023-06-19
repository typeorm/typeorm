import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn({
        type: "int",
    })
    id: number

    @Column("varchar")
    name: string

    @Column("timestamp")
    publishedAt: Date
}
