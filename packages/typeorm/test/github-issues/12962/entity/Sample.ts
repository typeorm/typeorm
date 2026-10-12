import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Sample {
    @PrimaryGeneratedColumn({ name: "sample_id" })
    id: number

    @Column({ unique: true })
    code: string

    @Column()
    value: number
}
