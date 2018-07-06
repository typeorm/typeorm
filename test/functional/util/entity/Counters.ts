import { Entity } from "../../../../src/decorator/entity/Entity";
import { PrimaryColumn } from "../../../../src/decorator/columns/PrimaryColumn";

@Entity()
export class Counters {
    
    @PrimaryColumn("binary", {
        length: 1
    })
    id: Buffer;

}
