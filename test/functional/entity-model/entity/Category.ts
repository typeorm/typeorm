import { BaseEntity, Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity()
export class Category extends BaseEntity {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

}
