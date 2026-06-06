import { useState } from "react";
import { FileText } from "lucide-react";
import { Card } from "./ui/card";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import type { Certificate } from "./types";

interface Props {
  certificate: Certificate;
  onClick: () => void;
}

export function CertificateCard({ certificate, onClick }: Props) {
  const [thumbError, setThumbError] = useState(false);
  const hasThumbnail = certificate.thumbnailUrl && !thumbError;

  return (
    <Card
      onClick={onClick}
      className="overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 p-0 gap-0 rounded-2xl border-white/60 bg-white/80 backdrop-blur"
    >
      <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden bg-[#ece3f7]">
        {hasThumbnail ? (
          <img
            src={certificate.thumbnailUrl}
            alt={certificate.name}
            className="w-full h-full object-cover"
            onError={() => setThumbError(true)}
          />
        ) : certificate.type === "pdf" ? (
          <div className="flex flex-col items-center justify-center gap-2 text-[#7c5cc4]">
            <FileText className="w-16 h-16" />
            <span className="uppercase tracking-[0.3em]">PDF</span>
          </div>
        ) : (
          <ImageWithFallback
            src={certificate.url}
            alt={certificate.name}
            className="w-full h-full object-cover"
          />
        )}
      </div>
    </Card>
  );
}
