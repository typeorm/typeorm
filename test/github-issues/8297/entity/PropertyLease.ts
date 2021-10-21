import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "../../../../src";
import { Property } from "./Property";
import { PropertyLeaseType } from "./PropertyLeaseType";

@Entity()
export class PropertyLease {
    @PrimaryColumn({ name: "LeaseId" })
    id: number;

    @ManyToOne(() => Property)
    @JoinColumn({ name: "PropertyId" })
    property: Property;

    @ManyToOne(() => PropertyLeaseType)
    @JoinColumn({ name: "LeaseTypeId" })
    type: PropertyLeaseType;
}
