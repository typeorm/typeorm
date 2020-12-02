import { DistributiveOperatorBuilder, DistributiveOperatorGen } from "./Distributive";

export const Or = DistributiveOperatorGen(() => OrBuilder);

export class OrBuilder extends DistributiveOperatorBuilder {
    get operator(): string { return "OR"; }
}
