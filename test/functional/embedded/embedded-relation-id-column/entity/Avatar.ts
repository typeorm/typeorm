import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../src"

@Entity()
export class Avatar {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    url: string
}
