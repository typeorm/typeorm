import { Entity, Column, PrimaryColumn } from "../../../../src";

@Entity()
export class PropertyType {
    @PrimaryColumn({ name: "PropertyTypeId" })
    id: number;

    @Column()
    name: string;
}
