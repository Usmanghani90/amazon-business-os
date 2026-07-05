import { FileText, ImageIcon, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { isS3Configured } from "@/lib/s3";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentUploader } from "@/components/documents/document-uploader";
import { DeleteDocumentButton } from "@/components/documents/delete-document-button";
import { formatRelative } from "@/lib/format";

function fileSize(bytes?: number | null) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export async function DocumentsPanel({
  entityType,
  entityId,
  title = "Documents",
  description,
}: {
  entityType: string;
  entityId?: string;
  title?: string;
  description?: string;
}) {
  const configured = isS3Configured();
  const documents = await db.document.findMany({
    where: { entityType, ...(entityId ? { entityId } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        <DocumentUploader entityType={entityType} entityId={entityId} configured={configured} />
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {configured ? "No documents uploaded yet." : "Connect storage to start uploading documents."}
          </p>
        ) : (
          <ul className="divide-y">
            {documents.map((d) => {
              const isImage = d.mimeType?.startsWith("image/");
              const Icon = isImage ? ImageIcon : FileText;
              return (
                <li key={d.id} className="flex items-center gap-3 py-2.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {fileSize(d.sizeBytes)} · {formatRelative(d.createdAt)}
                    </p>
                  </div>
                  <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Open document">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <DeleteDocumentButton id={d.id} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
