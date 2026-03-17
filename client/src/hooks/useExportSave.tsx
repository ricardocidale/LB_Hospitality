import { useState, useCallback } from "react";
import { ExportSaveDialog } from "@/components/ExportSaveDialog";

interface ExportSaveState {
  open: boolean;
  suggestedName: string;
  extension: string;
  onConfirm: (filename: string) => void;
}

export function useExportSave() {
  const [state, setState] = useState<ExportSaveState>({
    open: false,
    suggestedName: "",
    extension: "",
    onConfirm: () => {},
  });

  const requestSave = useCallback((suggestedName: string, extension: string, onConfirm: (filename: string) => void) => {
    setState({ open: true, suggestedName, extension, onConfirm });
  }, []);

  const handleConfirm = useCallback((filename: string) => {
    state.onConfirm(filename);
    setState((prev) => ({ ...prev, open: false }));
  }, [state.onConfirm]);

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  const SaveDialog = (
    <ExportSaveDialog
      open={state.open}
      suggestedName={state.suggestedName}
      extension={state.extension}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { requestSave, SaveDialog };
}
