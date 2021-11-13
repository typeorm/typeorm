import {Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Unique} from "../../../../src";
import {UserMeta} from "./UserMeta";

@Entity()
@Unique(["userMetaId"])
@Unique(["id", "userMetaId"])
export class User {
    @PrimaryGeneratedColumn({ type:"bigint" })
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

    @Column({ nullable: false, })
    userMetaId: number;

    @OneToOne(() => UserMeta)
    @JoinColumn({ name: "userMetaId", referencedColumnName: "id" })
    userMeta: UserMeta;

}
