import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {WrappedNumber, wrappedNumberTransformer} from "../wrapped-number";

@Entity()
export class Dummy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("int4", {transformer: wrappedNumberTransformer})
    value: WrappedNumber;
}
