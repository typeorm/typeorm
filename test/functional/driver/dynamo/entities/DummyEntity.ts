import { Column, Entity, PrimaryColumn } from "../../../../../src";
import { GlobalSecondaryIndex } from "../../../../../src/decorator/entity/GlobalSecondaryIndex";

@GlobalSecondaryIndex({ name: "adjustmentGroupIdStatusIndex", partitionKey: ["adjustmentGroupId", "adjustmentStatus"], sortKey: "lineItemNumber" })
@Entity({ name: "dummy_t" })
export class DummyEntity {
    @PrimaryColumn({ name: "id", type: "varchar" })
    id: string;

    @Column({ name: "adjustmentGroupId", type: "varchar" })
    adjustmentGroupId: string;

    @Column({ name: "adjustmentStatus", type: "varchar" })
    adjustmentStatus: string;

    // in dynamodb  we don't need to map all columns
    name: string;

    @Column({ name: "lineItemNumber", type: "int" })
    lineItemNumber: number;
}
