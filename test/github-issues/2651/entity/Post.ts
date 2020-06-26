import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "@typeorm/core";

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @UpdateDateColumn({type: "timestamptz"})
    updatedAt: Date;

}
