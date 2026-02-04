import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Record {
    @PrimaryGeneratedColumn()
    id: number

    @Column({ type: "json", nullable: true })
    config: any

    @Column({ type: "jsonb", nullable: true })
    data: any

    @Column({
        type: "jsonb",
        nullable: true,
        default: { hello: "world'O", foo: "bar" },
    })
    dataWithDefaultObject: any

    @Column({ type: "jsonb", nullable: true, default: null })
    dataWithDefaultNull: any
}
