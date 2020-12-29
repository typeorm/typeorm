import { CreateDateColumn, Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "../../../../src";

@Entity({ name: "Test" })
export class Test {

    @PrimaryGeneratedColumn()
    id?: number;

    @CreateDateColumn({
        type: "timestamp",
        precision: null,
        default: () => "CURRENT_TIMESTAMP"
    })
    createTimestamp: Date;

    @UpdateDateColumn({
        type: "timestamp",
        precision: null,
        default: () => "CURRENT_TIMESTAMP"
    })
    updateTimestamp: Date;

    @Column({
        type: "timestamp",
        default: () => "CURRENT_TIMESTAMP",
    })
    anotherTimestamp: Date;
}
