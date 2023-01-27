export interface AggregatedItemInfo {
    id: number;
    name: string | null;
    nameEn: string | null;
    nameKr: string | null;
    nameJa: string | null;
    nameFr: string | null;
    nameDe: string | null;
    desc: string | null;
    descKr: string | null;
    itemIcon: string;
    itemUiCategoryName: string;
    itemUiCategoryNameKr: string | null;
    itemLevel: number;
    isCollectable: number;
    desynth: number;
    gamePatchVersion: string;
}