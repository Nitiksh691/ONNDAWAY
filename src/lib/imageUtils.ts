/**
 * Image optimization & client-side compression utilities for ONN DA WAY
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "image/jpeg" | "image/webp";
}

/**
 * Compresses an image client-side before sending to server/Cloudinary.
 * Reduces 5MB-15MB mobile camera photos to ~100-200KB in ~50ms.
 */
export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    format = "image/jpeg",
  } = options;

  return new Promise((resolve, reject) => {
    // If not in browser or not an image, fall back to FileReader
    if (typeof window === "undefined" || !file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // Skip GIFs (compression breaks animated GIFs)
    if (file.type === "image/gif") {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      // Calculate constrained dimensions
      if (width > maxWidth || height > maxHeight) {
        if (width / height > maxWidth / maxHeight) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) {
        // Fallback to FileReader if 2D context is not available
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      // Draw white background in case of transparent PNG converted to JPEG
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      // Smooth downsampling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      try {
        const compressedDataUrl = canvas.toDataURL(format, quality);
        resolve(compressedDataUrl);
      } catch (err) {
        // Fallback to FileReader
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Enhances Cloudinary URLs with dynamic on-the-fly edge transformations:
 * - f_auto: Optimal next-gen format (AVIF / WebP) based on client browser
 * - q_auto:good: Visual perceptual quality optimization (drops file size by 70%)
 * - w_{width},c_limit: Downscale to target width if larger (preserves aspect ratio)
 */
export function getOptimizedImageUrl(
  url: string | null | undefined,
  width: number = 600
): string {
  if (!url || typeof url !== "string") {
    return "https://res.cloudinary.com/dr4nfueet/image/upload/f_auto,q_auto,w_600/v1791312577/onndaway/menu/w8ggcbikrhw7nuvm2oic.jpg";
  }

  // Handle Cloudinary URLs
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    // Avoid double transforming if already present
    if (url.includes("/upload/f_auto") || url.includes("/upload/w_") || url.includes("/upload/q_")) {
      return url;
    }

    const transform = `f_auto,q_auto:good,w_${width},c_limit`;
    return url.replace("/upload/", `/upload/${transform}/`);
  }

  return url;
}
