export interface Certificate {
  id: string;
  name: string;
  url: string;
  type: "pdf" | "image";
  thumbnailUrl?: string;
  issuer?: string;
  date?: string;
}
