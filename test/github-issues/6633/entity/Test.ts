import { Entity, PrimaryColumn, Index, Column } from "typeorm"

@Entity()
export class Test {
    @PrimaryColumn()
    id: number

    @Index("description_index", { fulltext: true })
    @Column()
    description: string
}
