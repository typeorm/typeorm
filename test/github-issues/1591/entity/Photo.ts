import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Photo {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    date: Date
}
