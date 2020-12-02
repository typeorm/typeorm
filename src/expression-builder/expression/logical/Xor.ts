import {DistributiveOperatorBuilder, DistributiveOperatorGen} from "./Distributive";

export const Xor = DistributiveOperatorGen(() => XorBuilder);

export class XorBuilder extends DistributiveOperatorBuilder {
    get operator(): string { return "XOR"; }
}
