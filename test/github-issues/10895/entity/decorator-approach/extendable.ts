import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Extendable {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    value: number
}
