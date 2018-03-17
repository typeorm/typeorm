import {expect} from "chai";
import {ObjectInstantiator} from "../../../src/util/ObjectInstantiator";

describe("util > ObjectInstantiator", () => {

    class Foo {

        initialized?: true;

        constructor() {
            this.initialized = true;
        }

    }

    class Bar {

        initialized?: true;

        constructor() {
            this.initialized = true;
        }

    }

    it("should skip constructor on create new instance", () => {

        const foo = ObjectInstantiator.createInstanceWithoutConstructor(Foo);
        const bar = ObjectInstantiator.createInstanceWithoutConstructor(Bar);

        expect(foo).to.be.instanceof(Foo);
        expect(foo.initialized).to.be.undefined;

        expect(bar).to.be.instanceof(Bar);
        expect(bar.initialized).to.be.undefined;

    });

});
