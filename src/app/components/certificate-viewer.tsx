import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "./ui/dialog";
import { Button } from "./ui/button";
import { Download, ExternalLink } from "lucide-react";
import type { Certificate } from "./types";

interface Props {
  certificate: Certificate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CertificateViewer({ certificate, open, onOpenChange }: Props) {
  if (!certificate) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate">{certificate.name}</DialogTitle>
            <DialogDescription className="truncate">
              {certificate.issuer || "Certificate"}
              {certificate.date ? ` · ${certificate.date}` : ""}
            </DialogDescription>
          </div>
          <div className="flex gap-2 shrink-0 ml-4">
            <Button asChild variant="outline" size="sm">
              <a href={certificate.url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4" /> Open
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={certificate.url} download>
                <Download className="w-4 h-4" /> Download
              </a>
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 min-h-0 bg-muted">
          {certificate.type === "pdf" ? (
            <iframe
              src={certificate.url}
              title={certificate.name}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
              <img
                src={certificate.thumbnailUrl?.replace("w800", "w4000") || certificate.url}
                alt={certificate.name}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
