import {
    Entity,
    PrimaryColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from "../../../../src";
import { PropertyLease } from "./PropertyLease";
import { PropertyType } from "./PropertyType";

@Entity()
export class Property {
    @PrimaryColumn({ name: "PropertyId" })
    id: number;

    @ManyToOne(() => PropertyType)
    @JoinColumn({ name: "PropertyTypeId" })
    type: PropertyType;

    @OneToMany(() => PropertyLease, (leases) => leases.property)
    leases: PropertyLease[];
}
