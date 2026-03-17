const MIME_TYPES: Record<string, string> = {
  ".csv": "text/csv",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".pdf": "application/pdf",
  ".png": "image/png",
};

const FILE_TYPE_DESCRIPTIONS: Record<string, string> = {
  ".csv": "CSV Spreadsheet",
  ".xlsx": "Excel Workbook",
  ".pptx": "PowerPoint Presentation",
  ".pdf": "PDF Document",
  ".png": "PNG Image",
};

function getExtension(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot >= 0 ? filename.substring(dot).toLowerCase() : "";
}

function hasFilePicker(): boolean {
  return typeof window !== "undefined" && "showSaveFilePicker" in window;
}

export async function saveFile(blob: Blob, suggestedName: string): Promise<void> {
  const ext = getExtension(suggestedName);
  if (hasFilePicker()) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: FILE_TYPE_DESCRIPTIONS[ext] || "File",
            accept: { [MIME_TYPES[ext] || "application/octet-stream"]: [ext] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return;
    } catch (err: any) {
      if (err?.name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = suggestedName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function saveDataUrl(dataUrl: string, suggestedName: string): Promise<void> {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  await saveFile(blob, suggestedName);
}
