import { DistributiveOperatorBuilder, DistributiveOperatorGen } from "./Distributive";

export const And = DistributiveOperatorGen(() => AndBuilder);

export class AndBuilder extends DistributiveOperatorBuilder {
    get operator(): string { return "AND"; }
}
