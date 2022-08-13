import {
    Column,
    Entity,
    JoinColumn,
    OneToOne,
    PrimaryColumn,
} from "../../../../src"
@Entity("testEntity")
export class TestEntity {
    @PrimaryColumn()
    @OneToOne("User", "id")
    @JoinColumn({ name: "userId" })
    public userId: string

    @Column({ type: "jsonb", nullable: false })
    public x: string[]
}
