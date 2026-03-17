const BASE_URL = "https://api.vecteezy.com/v1";

interface VecteezySearchOptions {
  resourceType?: "vector" | "photo" | "video";
  licenseType?: "free" | "pro";
  page?: number;
  perPage?: number;
  sort?: "relevant" | "popular" | "recent";
}

interface VecteezyContributor {
  name: string;
}

interface VecteezyResource {
  id: string;
  title: string;
  resource_type: string;
  preview: { url: string };
  downloads: { url: string };
  license_type: string;
  contributor: VecteezyContributor;
}

interface VecteezySearchResponse {
  data: VecteezyResource[];
  pagination: {
    total: number;
    page: number;
    per_page: number;
  };
}

interface VecteezyDownloadResponse {
  data: {
    download_url: string;
  };
}

function getApiKey(): string {
  const key = process.env.VECTEEZY_API_KEY;
  if (!key) {
    throw new Error(
      "VECTEEZY_API_KEY environment variable is not set. Get one at https://www.vecteezy.com/developers"
    );
  }
  return key;
}

function buildHeaders(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
  };
}

async function search(
  query: string,
  options: VecteezySearchOptions = {}
): Promise<VecteezySearchResponse> {
  const params = new URLSearchParams({
    search_query: query,
    resource_type: options.resourceType ?? "vector",
    license_type: options.licenseType ?? "free",
    page: String(options.page ?? 1),
    per_page: String(options.perPage ?? 20),
    sort: options.sort ?? "relevant",
  });

  const response = await fetch(`${BASE_URL}/resources?${params.toString()}`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Vecteezy search failed: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as VecteezySearchResponse;
}

async function getResource(id: string): Promise<VecteezyResource> {
  const response = await fetch(`${BASE_URL}/resources/${id}`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Vecteezy getResource failed: ${response.status} ${response.statusText}`
    );
  }

  const result = (await response.json()) as { data: VecteezyResource };
  return result.data;
}

async function getDownloadUrl(id: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/resources/${id}/download`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error(
      `Vecteezy download failed: ${response.status} ${response.statusText}`
    );
  }

  const result = (await response.json()) as VecteezyDownloadResponse;
  return result.data.download_url;
}

export const vecteezyService = {
  search,
  getResource,
  getDownloadUrl,
};

export type {
  VecteezySearchOptions,
  VecteezyResource,
  VecteezySearchResponse,
};
