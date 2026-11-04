// cloudinary.ts
// Uploads images from the admin portal to Cloudinary and returns their public links.
// Only the cloud name and an UNSIGNED upload preset are used, so no secret ever reaches the browser.
// Set both in web/.env (see web/.env.example):
//   VITE_CLOUDINARY_CLOUD_NAME   the cloud name shown in the Cloudinary dashboard
//   VITE_CLOUDINARY_UPLOAD_PRESET   the name of an unsigned upload preset, e.g. lala_unsigned

const MAX_FILE_SIZE_MB = 5;

/** True when both Cloudinary values are set in web/.env. The form falls back to HTTPS URL
 * fields when they are not, so the portal still works without Cloudinary. */
export function uploadsConfigured(): boolean {
  return Boolean(
    import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] && import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"],
  );
}

// Uploads one image file and returns its secure (https) URL.
// Save that URL string in Firestore (logoUrl, or inside the galleryUrls array), never the file itself.
export async function uploadImage(file: File): Promise<string> {
  const cloudName = import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"];
  const preset = import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"];
  if (!cloudName || !preset) {
    throw new Error("Cloudinary is not configured. Check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in web/.env, then restart the dev server.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image.`);
  }
  if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
    throw new Error(`${file.name} is larger than ${MAX_FILE_SIZE_MB} MB.`);
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", preset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await response.json().catch(() => null);

  // Cloudinary explains what went wrong (for example "Upload preset not found") in data.error.message
  if (!response.ok || !data?.secure_url) {
    throw new Error(data?.error?.message ?? "Image upload failed.");
  }
  return data.secure_url as string;
}
