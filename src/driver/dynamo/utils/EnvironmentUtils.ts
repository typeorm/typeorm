declare let process: { env: { [key: string]: any }};
export const environmentUtils = {
    isTrue(name: string) {
        const value = process.env[name];
        return value === true || value === "true";
    }
};
