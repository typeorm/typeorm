import {BaseEntity, Column, Entity, PrimaryGeneratedColumn} from "../../../../src";

@Entity("foo_test")
export class Foo extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({
        nullable: false,
        type: "varchar",
        default: () => "TO_CHAR(100, 'FMU000')",
    })
    displayId: string;
}
