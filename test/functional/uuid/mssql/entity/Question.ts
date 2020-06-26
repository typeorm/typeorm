import { Column, Entity, Generated, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Question {

    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    @Generated("uuid")
    uuid: string;

    @Column("uniqueidentifier", {nullable: true})
    uuid2: string | null;

    @Column("uniqueidentifier", {nullable: true})
    @Generated("uuid")
    uuid3: string | null;

}
