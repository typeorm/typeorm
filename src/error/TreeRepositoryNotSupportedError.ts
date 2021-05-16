import {Driver} from "../driver/Driver";

export class TreeRepositoryNotSupportedError extends Error {
    name = "TreeRepositoryNotSupportedError";

    constructor(driver: Driver) {
        super();
        Object.setPrototypeOf(this, TreeRepositoryNotSupportedError.prototype);
        this.message = `Tree repositories are not supported in ${driver.options.type} driver.`;
    }

}