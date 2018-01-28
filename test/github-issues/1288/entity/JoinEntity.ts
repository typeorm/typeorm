import {Column, Entity, PrimaryGeneratedColumn} from "../../../../src";
import {isNumber, isString} from "util";

@Entity("join_1288")
export class JoinEntity {
    constructor(cfg: any = {}) {
        if (isNumber(cfg.id)) this.id = cfg.id;
        if (isString(cfg.spec)) this.spec = cfg.spec;
    }

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    spec: string;
}