import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "@typeorm/core";

@Entity()
export class PostWithUpdateDate {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @UpdateDateColumn()
    updateDate: Date;

}
