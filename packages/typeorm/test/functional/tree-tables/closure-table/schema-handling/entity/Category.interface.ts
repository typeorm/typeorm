export interface ICategory {
    id: number
    name: string
    parentCategory: ICategory | null
    childCategories: ICategory[]
}
