// ============================================
// FOLDER TYPES
// ============================================

export interface Folder {
    id: string;
    userId: string;
    name: string;
    nameKu: string | null;
    icon: string;
    color: string;
    isDefault: boolean;
    sortOrder: number;
    noteCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFolderInput {
    name: string;
    nameKu?: string;
    icon?: string;
    color?: string;
}

export interface UpdateFolderInput {
    name?: string;
    nameKu?: string;
    icon?: string;
    color?: string;
    sortOrder?: number;
}
