import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    data: number;
}
