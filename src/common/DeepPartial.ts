/**
 * Same as Partial<T> but goes deeper and makes Partial<T> all its properties and sub-properties.
 * Implemented in FTRX-5492 to support upgrading typescript to 3.6.
 * This is not the latest version of the code provided by typeorm, but it fixes beast.
 * @see https://github.com/Microsoft/TypeScript/issues/21592#issuecomment-496723647
 */
export type DeepPartial<T> = {
    [P in keyof T]?: T[P] extends never ? DeepPartial<T[P]> : DeepPartial<T[P]>
};
