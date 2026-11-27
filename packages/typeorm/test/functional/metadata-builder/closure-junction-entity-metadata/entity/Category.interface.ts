export interface ICategory {
    id: number
    name: string
    parent: ICategory | null
    children: ICategory[]
}
