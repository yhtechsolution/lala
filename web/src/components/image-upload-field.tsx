// image-upload-field.tsx
// A file picker that uploads the chosen images to Cloudinary and hands the resulting links
// back to the form. Use one for the logo and one with `multiple` for the gallery.
import { useState } from "react";
import type { ChangeEvent } from "react";
import { uploadImage } from "../lib/cloudinary";

interface ImageUploadFieldProps {
  label: string;
  value: string[]; // links of the images chosen so far (the logo is a list of one)
  onChange: (urls: string[]) => void;
  multiple?: boolean; // true for the gallery, false for the logo
}

export function ImageUploadField({ label, value, onChange, multiple = false }: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Uploads every file that was picked, then reports the new list of links to the form.
  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = ""; // lets the same file be picked again after a failure
    if (files.length === 0) return;

    setUploading(true);
    setError(null);
    try {
      const urls = await Promise.all(files.map((file) => uploadImage(file)));
      // The logo is replaced; gallery images are added to the existing ones.
      onChange(multiple ? [...value, ...urls] : urls.slice(0, 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  // Removes one image from the list (it stays on Cloudinary, only the link is dropped).
  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{label}</label>
      <input type="file" accept="image/*" multiple={multiple} disabled={uploading} onChange={handleFiles} />
      {uploading && <p className="text-sm text-gray-500">Uploading...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, index) => (
            <div key={url} className="relative">
              <img src={url} alt={`${label} ${index + 1}`} className="h-20 w-20 rounded object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1 text-xs text-white"
                aria-label={`Remove ${label} ${index + 1}`}
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface ImageUploadInputProps {
  name: string; // the form field name, e.g. "logoUrl" or "galleryUrls"
  label: string;
  initial?: string[]; // links already saved (when editing a guesthouse)
  multiple?: boolean;
}

// Form-friendly version of ImageUploadField for forms that read their values with FormData.
// It keeps the uploaded links in state and writes them into a hidden input named `name`,
// one link per line, which is the same text format the existing logoUrl / galleryUrls fields use.
export function ImageUploadInput({ name, label, initial = [], multiple = false }: ImageUploadInputProps) {
  const [urls, setUrls] = useState<string[]>(initial);
  return (
    <>
      <ImageUploadField label={label} value={urls} onChange={setUrls} multiple={multiple} />
      <input type="hidden" name={name} value={urls.join("\n")} />
    </>
  );
}
