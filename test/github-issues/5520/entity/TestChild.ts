import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class TestChild {
    @Column()
    public value: string
    @PrimaryGeneratedColumn("uuid")
    public uuid: string
}
