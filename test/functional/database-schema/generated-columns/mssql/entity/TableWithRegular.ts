import { Column, Entity, PrimaryGeneratedColumn } from "../../../../../../src"

@Entity()
export class TableWithRegular {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    fullName: string
}
