declare const _default: {
    name: string;
    table: {
        name: string;
    };
    columns: {
        id: {
            type: string;
            primary: boolean;
            generated: boolean;
        };
        title: {
            type: string;
            nullable: boolean;
        };
    };
    target: () => void;
};
export default _default;
