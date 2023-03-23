import { Column, Entity, PrimaryGeneratedColumn } from "../../../../src"

@Entity()
export class Test {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar")
    name: string
}
