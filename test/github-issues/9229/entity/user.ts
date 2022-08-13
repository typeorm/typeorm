import { Entity, OneToOne, PrimaryColumn } from "../../../../src"
@Entity("user")
export class User {
    @PrimaryColumn()
    @OneToOne("TestEntity", "userId")
    public id: string
}
