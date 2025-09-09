// Shared types for backend services
export interface PackingListItem {
  id?: string;
  name: string;
  category: string;
  qty: number;
  packed?: boolean;
  notes?: string;
  order?: number;
  lastUpdatedOfflineAt?: number;
  packingListId?: string;
}

export interface PatchOp {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: any;
  from?: string;
}