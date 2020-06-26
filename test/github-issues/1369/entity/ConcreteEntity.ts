import { Column, Entity } from "@typeorm/core";
import { AbstractEntity } from "./AbstractEntity";

@Entity()
export class ConcreteEntity extends AbstractEntity {
    @Column() position: string;
}
