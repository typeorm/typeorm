import { TypeORMError } from "./TypeORMError"

/**
 * Thrown when driver is not initialized
 */
export class DriverNotInitialized extends TypeORMError {
    constructor(driverType: string) {
        super(
            `Driver: "${driverType}", is not initialized.`,
        )
    }
}
