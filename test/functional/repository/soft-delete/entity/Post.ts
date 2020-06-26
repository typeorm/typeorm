import { BaseEntity, Column, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @DeleteDateColumn()
    deletedAt: Date;

    @Column()
    name: string;
}
