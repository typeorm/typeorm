import {ValueTransformer} from "../../../../src/decorator/options/ValueTransformer";
import {SelfReferencing} from "./SelfReferencing";

export class SelfReferencingTransformer implements ValueTransformer {

    to ({value}: SelfReferencing): string {
        return value;
    }

    from (value: string): SelfReferencing {
        return new SelfReferencing(value);
    }

}
