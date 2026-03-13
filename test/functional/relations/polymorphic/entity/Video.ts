import { Entity, PrimaryGeneratedColumn, Column } from "../../../../../src"

@Entity()
export class Video {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    title: string
}
