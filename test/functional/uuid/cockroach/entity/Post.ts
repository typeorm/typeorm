import { Column, Entity, Generated, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post {

    @PrimaryGeneratedColumn()
    id: string;

    @Column()
    @Generated("uuid")
    uuid: string;

}
