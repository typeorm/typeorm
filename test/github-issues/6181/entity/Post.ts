import { Column } from "../../../../src/decorator/columns/Column";
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn";
import { Entity } from "../../../../src/decorator/entity/Entity";
import { SelfReferencing } from "./SelfReferencing";
import { SelfReferencingTransformer } from "./SelfReferencingTransformer";

@Entity()
export class Post {
    @PrimaryColumn()
    id: number;

    @Column({
        type: "simple-json",
        nullable: true,
        transformer: new SelfReferencingTransformer()
    })
    selfReferencing: SelfReferencing;
}
