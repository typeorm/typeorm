import {Entity} from "../../../../src/decorator/entity/Entity";
import {Column} from "../../../../src/decorator/columns/Column";
import {PrimaryGeneratedColumn} from "../../../../src/decorator/columns/PrimaryGeneratedColumn";
import {WrappedString, wrappedStringTransformer} from "../wrapped-string";

@Entity()
export class Dummy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("string", {transformer: wrappedStringTransformer})
    value: WrappedString;
}
