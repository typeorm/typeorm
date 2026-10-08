import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class ClientRow {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    groupId: number
}
