export type SortableColumnData<T> = {
    key: T;
    label: string;
    align?: "left" | "center" | "right";
    sortable?: boolean;
};

export type SortableTableProps = {
    limit?: number;
    page?: number;
    total?: number;
}
