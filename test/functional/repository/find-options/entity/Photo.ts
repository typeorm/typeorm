import { Column, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn } from "@typeorm/core";
import { Category } from "./Category";

@Entity()
export class Photo {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        length: 500
    })
    name: string;

    @Column()
    description: string;

    @Column()
    filename: string;

    @Column()
    views: number;

    @Column()
    isPublished: boolean;

    @ManyToMany(type => Category)
    @JoinTable()
    categories: Category[];

}
