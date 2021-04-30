import {DeepPartial} from "../../../src";
import {Comment} from "./entity/Comment";

describe("github issues > #6580 DeepPartial does not handle `any` and `{[k: string]}`", () => {

    function attemptDeepPartial(entityLike: DeepPartial<Comment>): void {
    }

    it("DeepPartial should correctly handle any", () => {
        attemptDeepPartial({
            // eslint-disable-next-line id-blacklist
            any: {
                foo: "bar",
            }
        });
    });

    it("DeepPartial should correctly handle {[k: string]: any}", () => {
        attemptDeepPartial({
            object: {
                foo: "bar"
            },
        });
    });
});
