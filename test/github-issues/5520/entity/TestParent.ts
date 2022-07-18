import { Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { TestChild } from "./TestChild"

@Entity()
export class TestParent {
    @OneToOne("TestChild", {
        nullable: true,
        eager: true,
        cascade: true,
    })
    @JoinColumn()
    public child: TestChild
    @PrimaryGeneratedColumn("uuid")
    public uuid: string
}
