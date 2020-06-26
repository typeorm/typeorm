import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class PostWithoutDeleteDateColumn extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;
}
