import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Animal {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => Category)
    category: Category;

}
