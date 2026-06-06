import { useEffect, useState } from "react";
import type { Certificate } from "./types";

// Extracts a Google Drive file ID from common URL shapes.
function extractDriveId(url: string): string | null {
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

// Extracts a Google Drive FOLDER ID from a folder URL.
function extractDriveFolderId(url: string): string | null {
  const m = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function inferType(name: string, url: string): "pdf" | "image" {
  const lower = (name + " " + url).toLowerCase();
  if (lower.includes(".pdf")) return "pdf";
  return "image";
}

// Normalizes a raw manifest entry into a Certificate.
// Accepts either { name, url, ... } objects or plain URL strings.
function normalize(raw: any, index: number): Certificate | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    return {
      id: String(index),
      name: `Certificate ${index + 1}`,
      url: raw,
      type: inferType(raw, raw),
    };
  }
  const url: string | undefined = raw.url || raw.link || raw.href;
  if (!url) return null;

  const driveId = extractDriveId(url);
  const directUrl = driveId
    ? `https://drive.google.com/uc?export=view&id=${driveId}`
    : url;
  const thumb = driveId
    ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w800`
    : raw.thumbnail || raw.thumbnailUrl;

  const type: "pdf" | "image" =
    raw.type === "pdf" || raw.type === "image"
      ? raw.type
      : inferType(raw.name || "", url);

  return {
    id: raw.id || String(index),
    name: raw.name || raw.title || `Certificate ${index + 1}`,
    url: type === "pdf" && driveId
      ? `https://drive.google.com/file/d/${driveId}/preview`
      : directUrl,
    thumbnailUrl: thumb,
    type,
    issuer: raw.issuer,
    date: raw.date,
  };
}

// Fetch all files from a public Google Drive folder using Drive API v3.
// Requires a Google API key. Handles pagination automatically.
async function fetchDriveFolder(folderId: string, apiKey: string): Promise<Certificate[]> {
  const certificates: Certificate[] = [];
  let pageToken = "";

  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "nextPageToken,files(id,name,mimeType,createdTime)",
      orderBy: "name",
      pageSize: "100",
      key: apiKey,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?${params}`
    );
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Drive API ${res.status}: ${errBody}`);
    }
    const data = await res.json();

    for (const file of data.files || []) {
      const isImage = file.mimeType?.startsWith("image/");
      const isPdf = file.mimeType === "application/pdf";
      if (!isImage && !isPdf) continue;

      // Strip file extension from display name
      const displayName = file.name.replace(/\.[^.]+$/, "");

      certificates.push({
        id: file.id,
        name: displayName,
        url: isPdf
          ? `https://drive.google.com/file/d/${file.id}/preview`
          : `https://drive.google.com/uc?export=view&id=${file.id}`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w800`,
        type: isPdf ? "pdf" : "image",
        date: file.createdTime
          ? new Date(file.createdTime).getFullYear().toString()
          : undefined,
      });
    }

    pageToken = data.nextPageToken || "";
  } while (pageToken);

  return certificates;
}

const MOCK: Certificate[] = [
  {
    id: "1",
    name: "Sample Certificate",
    url: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=1200",
    thumbnailUrl: "https://images.unsplash.com/photo-1607013251379-e6eecfffe234?w=800",
    type: "image",
    issuer: "Mock Issuer",
    date: "2025",
  },
];

export function useCertificates() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMock, setUsingMock] = useState(false);

  useEffect(() => {
    const manifestUrl = import.meta.env.VITE_CERTIFICATES_URL as
      | string
      | undefined;
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;

    if (!manifestUrl) {
      setCertificates(MOCK);
      setUsingMock(true);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        // Check if the URL is a Google Drive folder
        const folderId = extractDriveFolderId(manifestUrl);

        let results: Certificate[];

        if (folderId) {
          // Google Drive folder mode
          if (!apiKey) {
            throw new Error(
              "VITE_GOOGLE_API_KEY is required to list Google Drive folders. " +
              "Get a free key at https://console.cloud.google.com/apis/credentials " +
              "(enable 'Google Drive API')."
            );
          }
          results = await fetchDriveFolder(folderId, apiKey);
        } else {
          // Legacy JSON manifest mode
          const res = await fetch(manifestUrl);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          const list: any[] = Array.isArray(data)
            ? data
            : Array.isArray(data?.certificates)
              ? data.certificates
              : Array.isArray(data?.items)
                ? data.items
                : [];
          results = list
            .map((r, i) => normalize(r, i))
            .filter((c): c is Certificate => c !== null);
        }

        if (!cancelled) {
          setCertificates(results);
          setLoading(false);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Failed to load certificates");
          setCertificates(MOCK);
          setUsingMock(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { certificates, loading, error, usingMock };
}
