import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class BinarySetting {
    @PrimaryGeneratedColumn("increment")
    id: number

    @Column({ type: "binary", length: 1, unique: true })
    key: Buffer

    @Column()
    value: string
}
