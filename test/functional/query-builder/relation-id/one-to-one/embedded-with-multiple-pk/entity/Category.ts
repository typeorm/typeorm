import { Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Category {

    @PrimaryColumn()
    id: number;

    @PrimaryColumn()
    name: string;

}
