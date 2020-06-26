import { Column, Entity, Generated, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Question {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    @Generated("uuid")
    uuid: string;

    @Column("uuid")
    uuid2: string;

    @Column("uuid", {nullable: true})
    uuid3: string | null;

    @Column({nullable: true})
    @Generated("uuid")
    uuid4: string | null;

}
