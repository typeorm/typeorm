import { Entity, Column, PrimaryColumn } from "../../../../src";

@Entity()
export class PropertyLeaseType {
    @PrimaryColumn({ name: "LeaseTypeId" })
    id: number;

    @Column()
    name: string;
}
