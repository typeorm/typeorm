import { BaseEntity, Column, Entity, PrimaryColumn } from "@typeorm/core";

@Entity("category_test", {schema: "public"})
export class Category extends BaseEntity {

    @PrimaryColumn()
    id: number;

    @Column()
    name: string;

}
