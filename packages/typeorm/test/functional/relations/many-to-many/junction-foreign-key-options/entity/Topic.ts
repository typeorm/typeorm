import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class Topic {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
