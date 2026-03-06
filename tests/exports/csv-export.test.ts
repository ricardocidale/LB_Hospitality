import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// downloadCSV uses browser APIs (document, Blob, URL.createObjectURL).
// We mock these globals directly since jsdom is not installed.

let mockLink: any;
let capturedBlob: Blob | null;
let mockRevokeObjectURL: ReturnType<typeof vi.fn>;

beforeEach(() => {
  capturedBlob = null;
  mockLink = {
    href: "",
    download: "",
    click: vi.fn(),
  };

  // Mock document globals
  (globalThis as any).document = {
    createElement: vi.fn().mockReturnValue(mockLink),
    body: {
      appendChild: vi.fn().mockReturnValue(mockLink),
      removeChild: vi.fn().mockReturnValue(mockLink),
    },
  };

  // Attach createObjectURL / revokeObjectURL to the real URL constructor
  mockRevokeObjectURL = vi.fn();
  (URL as any).createObjectURL = vi.fn((blob: Blob) => {
    capturedBlob = blob;
    return "blob:http://test/abc123";
  });
  (URL as any).revokeObjectURL = mockRevokeObjectURL;
});

afterEach(() => {
  delete (globalThis as any).document;
});

// Dynamic import so the module sees our mocked globals
async function getDownloadCSV() {
  const mod = await import("../../client/src/lib/exports/csvExport");
  return mod.downloadCSV;
}

describe("downloadCSV", () => {
  it("creates a Blob with text/csv MIME type", async () => {
    const downloadCSV = await getDownloadCSV();
    downloadCSV("a,b,c\n1,2,3", "test.csv");

    expect(capturedBlob).toBeInstanceOf(Blob);
    expect(capturedBlob!.type).toBe("text/csv;charset=utf-8;");
  });

  it("sets the filename on the link element", async () => {
    const downloadCSV = await getDownloadCSV();
    downloadCSV("header\nrow", "my-export.csv");
    expect(mockLink.download).toBe("my-export.csv");
  });

  it("sets href to the blob URL", async () => {
    const downloadCSV = await getDownloadCSV();
    downloadCSV("data", "file.csv");
    expect(mockLink.href).toBe("blob:http://test/abc123");
  });

  it("triggers link click", async () => {
    const downloadCSV = await getDownloadCSV();
    downloadCSV("data", "file.csv");
    expect(mockLink.click).toHaveBeenCalledOnce();
  });

  it("appends and removes the link from document body", async () => {
    const downloadCSV = await getDownloadCSV();
    downloadCSV("data", "file.csv");
    expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
    expect(document.body.removeChild).toHaveBeenCalledWith(mockLink);
  });

  it("revokes the object URL for cleanup", async () => {
    const downloadCSV = await getDownloadCSV();
    downloadCSV("data", "file.csv");
    expect(mockRevokeObjectURL).toHaveBeenCalledOnce();
  });

  it("handles empty content", async () => {
    const downloadCSV = await getDownloadCSV();
    downloadCSV("", "empty.csv");
    expect(mockLink.click).toHaveBeenCalledOnce();
  });

  it("handles content with special characters", async () => {
    const downloadCSV = await getDownloadCSV();
    const content = '"Name","Value"\n"O\'Brien","$1,000"';
    downloadCSV(content, "special.csv");
    expect(mockLink.click).toHaveBeenCalledOnce();
  });

  it("returns true on success", async () => {
    const downloadCSV = await getDownloadCSV();
    const result = downloadCSV("data", "file.csv");
    expect(result).toBe(true);
  });

  it("sanitizes path characters from filename", async () => {
    const downloadCSV = await getDownloadCSV();
    downloadCSV("data", 'my/file:name*"test".csv');
    expect(mockLink.download).toBe("my_file_name__test_.csv");
  });

  it("returns false on error", async () => {
    const downloadCSV = await getDownloadCSV();
    // Break createElement to trigger catch
    (document as any).createElement = () => { throw new Error("boom"); };
    const result = downloadCSV("data", "file.csv");
    expect(result).toBe(false);
  });
});
