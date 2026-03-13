export interface AdminSaveState {
  isDirty: boolean;
  isPending: boolean;
  onSave: () => void;
}

/** Callback prop for tabs to report their save state to a parent shell. */
export type SaveStateCallback = (state: AdminSaveState | null) => void;
