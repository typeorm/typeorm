import { Entity, PrimaryGeneratedColumn, Column } from "../../../../src"

@Entity()
export class SuperLongRelatedEntityNameDontAskWhy {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string
}
