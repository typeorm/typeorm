export declare class Category {
    id: number;
    name: string;
    parentCategory: Category;
    childCategories: Category[];
    level: number;
}
