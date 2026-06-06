import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { CertificateCard } from "./components/certificate-card";
import { CertificateViewer } from "./components/certificate-viewer";
import { Skeleton } from "./components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { Badge } from "./components/ui/badge";
import { useCertificates } from "./components/use-certificates";
import type { Certificate } from "./components/types";

export default function App() {
  const { certificates, loading, error, usingMock } = useCertificates();
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [open, setOpen] = useState(false);

  const openCert = (c: Certificate) => {
    setSelected(c);
    setOpen(true);
  };

  return (
    <div className="min-h-screen w-full text-foreground bg-background">
      <header>
        <div className="max-w-6xl mx-auto px-6 py-12 flex items-end justify-between gap-4">
          <h1>Certificates</h1>
          {!loading && (
            <Badge className="border-0 bg-white/70 text-foreground shadow-sm hover:bg-white/70">
              {certificates.length} total
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {usingMock && (
          <Alert className="mb-6">
            <AlertCircle className="w-4 h-4" />
            <AlertTitle>Showing sample data</AlertTitle>
            <AlertDescription>
              {error ? `Could not load manifest: ${error}. ` : "Set the "}
              <code>VITE_CERTIFICATES_URL</code> environment variable to a JSON
              manifest URL (array of {`{ name, url, type, issuer, date }`}{" "}
              objects, or Google Drive share links).
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            No certificates found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <CertificateCard
                key={cert.id}
                certificate={cert}
                onClick={() => openCert(cert)}
              />
            ))}
          </div>
        )}
      </main>

      <CertificateViewer
        certificate={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
