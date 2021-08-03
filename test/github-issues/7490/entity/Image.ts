import {Column, Entity, PrimaryGeneratedColumn, DeleteDateColumn} from "../../../../src";

@Entity()
export class Image {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    url: string;
  
    @DeleteDateColumn()
    deletedAt: Date;
}
