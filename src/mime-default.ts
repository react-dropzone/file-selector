/**
 * A small set of the most common file extensions, bundled into the main entry so that
 * {@link fromEvent} guesses a MIME type for typeless files out of the box.
 *
 * This is the single source of truth for these defaults: the full extension-to-MIME table
 * (`COMMON_MIME_TYPES`, exposed via the `file-selector/mime` subpath) spreads this map in
 * rather than redefining these entries, so no value is duplicated across modules.
 *
 * See https://github.com/react-dropzone/file-selector/issues/127
 */
export const DEFAULT_MIME_TYPES: Map<string, string> = new Map([
  ["avif", "image/avif"],
  ["bmp", "image/bmp"],
  ["css", "text/css"],
  ["csv", "text/csv"],
  ["doc", "application/msword"],
  ["docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ["gif", "image/gif"],
  ["gz", "application/gzip"],
  ["htm", "text/html"],
  ["html", "text/html"],
  ["ico", "image/x-icon"],
  ["jpeg", "image/jpeg"],
  ["jpg", "image/jpeg"],
  ["js", "application/javascript"],
  ["json", "application/json"],
  ["md", "text/markdown"],
  ["mjs", "application/javascript"],
  ["mp3", "audio/mpeg"],
  ["mp4", "video/mp4"],
  ["ogg", "audio/ogg"],
  ["pdf", "application/pdf"],
  ["png", "image/png"],
  ["ppt", "application/powerpoint"],
  ["pptx", "application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ["svg", "image/svg+xml"],
  ["tif", "image/tiff"],
  ["tiff", "image/tiff"],
  ["txt", "text/plain"],
  ["wasm", "application/wasm"],
  ["wav", "audio/x-wav"],
  ["weba", "audio/webm"],
  ["webm", "video/webm"],
  ["webp", "image/webp"],
  ["xls", "application/vnd.ms-excel"],
  ["xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ["xml", "application/xml"],
  ["zip", "application/zip"]
]);
