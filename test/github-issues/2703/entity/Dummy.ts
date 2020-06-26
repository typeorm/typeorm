import { Column, Entity, PrimaryGeneratedColumn } from "@typeorm/core";
import { WrappedString, wrappedStringTransformer } from "../wrapped-string";

@Entity()
export class Dummy {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({type: String, transformer: wrappedStringTransformer})
    value: WrappedString;
}
