import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class PostUuid {

    @PrimaryGeneratedColumn("uuid")
    id: number;

    @Column()
    text: string;

}
