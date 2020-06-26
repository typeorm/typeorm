import { Entity, PrimaryGeneratedColumn } from "@typeorm/core";

@Entity()
export class Category {

    @PrimaryGeneratedColumn()
    id: number;

}
