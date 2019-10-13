import { Repository } from "../../../../src";
import { A } from "../entity/A";
import { B } from "../entity/B";
import { C } from "../entity/C";
export declare class Controller {
    t(a: A, b: B, c: C, aRepository?: Repository<A>, bRepository?: Repository<B>, cRepository?: Repository<C>): Promise<string[]>;
}
