import { DataSource } from "../data-source/DataSource"
import { Driver } from "./Driver"

export type DriverConstructor = new (dataSource: DataSource) => Driver

/**
 * Registry for custom database drivers.
 * Built-in drivers continue to use DriverFactory.
 * Custom drivers register here and take precedence.
 */
export class DriverRegistry {
    private static customDrivers = new Map<string, DriverConstructor>()

    /**
     * Register a custom driver constructor.
     * Must be called before creating a DataSource with that type.
     * @param type
     * @param constructor
     */
    static register(type: string, constructor: DriverConstructor): void {
        this.customDrivers.set(type, constructor)
    }

    /**
     * Unregister a custom driver.
     * @param type
     */
    static unregister(type: string): boolean {
        return this.customDrivers.delete(type)
    }

    /**
     * Check if a custom driver is registered for this type.
     * @param type
     */
    static has(type: string): boolean {
        return this.customDrivers.has(type)
    }

    /**
     * Get a custom driver constructor if registered.
     * @param type
     */
    static get(type: string): DriverConstructor | undefined {
        return this.customDrivers.get(type)
    }

    /**
     * Get all registered custom driver types.
     */
    static getCustomTypes(): string[] {
        return Array.from(this.customDrivers.keys())
    }

    /**
     * Clear all custom driver registrations (useful for testing).
     */
    static clear(): void {
        this.customDrivers.clear()
    }
}
