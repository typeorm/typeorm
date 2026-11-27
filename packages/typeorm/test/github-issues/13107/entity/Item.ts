import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Item {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column({
        default: 1,
        transformer: {
            from: (value: number | null) =>
                value == null ? value : value * 10,
            to: (value: number | null | undefined) =>
                value == null ? value : value / 10,
        },
    })
    score: number
}
