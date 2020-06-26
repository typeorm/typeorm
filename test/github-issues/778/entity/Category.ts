import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Category {

    @PrimaryGeneratedColumn({type: "bigint"})
    id: string;

    @Column()
    name: string;

}
