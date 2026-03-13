export interface AdminSaveState {
  isDirty: boolean;
  isPending: boolean;
  onSave: () => void;
}
