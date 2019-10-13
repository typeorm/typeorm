export declare class Category {
    id: number;
    name: string;
    oneCategory: Category;
    oneInverseCategory: Category;
    oneManyCategory: Category;
    oneManyCategories: Category[];
    manyCategories: Category[];
    manyInverseCategories: Category[];
}
