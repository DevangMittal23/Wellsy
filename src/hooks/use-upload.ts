"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

export function useUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (
      bucket: string,
      path: string,
      file: File
    ): Promise<string | null> => {
      setIsUploading(true);
      setProgress(0);
      setError(null);
      const supabase = createClient();

      try {
        // We use XMLHttpRequest under the hood if we want actual progress events,
        // or a simple custom implementation, or just Supabase upload if we don't need fine-grained progress.
        // Let's implement actual progress via XMLHttpRequest for a premium feel!
        const tokenResult = await supabase.auth.getSession();
        const token = tokenResult.data.session?.access_token;
        const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!projectUrl) {
          throw new Error("Supabase URL is not configured");
        }

        const url = `${projectUrl}/storage/v1/object/${bucket}/${path}`;

        return new Promise<string | null>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", url, true);
          xhr.setRequestHeader("x-upsert", "true");
          xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
          if (token) {
            xhr.setRequestHeader("Authorization", `Bearer ${token}`);
          }

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              setProgress(percent);
            }
          };

          xhr.onload = () => {
            setIsUploading(false);
            if (xhr.status >= 200 && xhr.status < 300) {
              // Return the public URL or file path
              const publicUrl = `${projectUrl}/storage/v1/object/public/${bucket}/${path}`;
              resolve(publicUrl);
            } else {
              const errMsg = `Upload failed with status ${xhr.status}`;
              setError(errMsg);
              reject(new Error(errMsg));
            }
          };

          xhr.onerror = () => {
            setIsUploading(false);
            setError("Upload failed due to a network error");
            reject(new Error("Network error"));
          };

          xhr.setRequestHeader("Cache-Control", "max-age=3600");
          xhr.send(file);
        });
      } catch (err: unknown) {
        setIsUploading(false);
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
        return null;
      }
    },
    []
  );

  return {
    uploadFile,
    isUploading,
    progress,
    error,
  };
}
