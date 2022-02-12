import {PrimaryGeneratedColumn} from "../../../../src";
import {Entity} from "../../../../src/decorator/entity/Entity";

@Entity()
export class AnotherReallyLongNameForAnEntityBecauseThisIsNecessaryB {
    @PrimaryGeneratedColumn()
    id: number;
}

@Entity()
export class AnotherRealLongNameForAnEntityBecauseThisIsNecessaryC {
    @PrimaryGeneratedColumn()
    id: number;
}
