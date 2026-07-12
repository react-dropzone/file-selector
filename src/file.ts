import {DEFAULT_MIME_TYPES} from "./mime-default";

export function toFileWithPath(file: File, path?: string, h?: FileSystemHandle): FileWithPath {
  const f = file as FileWithPath;
  const {webkitRelativePath} = file;
  const p =
    typeof path === "string"
      ? path
      : // If <input webkitdirectory> is set,
        // the File will have a {webkitRelativePath} property
        // https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/webkitdirectory
        typeof webkitRelativePath === "string" && webkitRelativePath.length > 0
        ? webkitRelativePath
        : `./${file.name}`;
  if (typeof f.path !== "string") {
    // on electron, path is already set to the absolute path
    setObjProp(f, "path", p);
  }
  if (h !== undefined) {
    Object.defineProperty(f, "handle", {
      value: h,
      writable: false,
      configurable: false,
      enumerable: true
    });
  }
  // Always populate a relative path so that even electron apps have access to a relativePath value
  setObjProp(f, "relativePath", p);
  return f;
}

export interface FileWithPath extends File {
  readonly path: string;
  readonly relativePath: string;
  readonly handle?: FileSystemFileHandle;
}

/**
 * Sets a File's `type` from its extension using the provided `mimeTypes` lookup,
 * but only when the browser didn't already set a type. Returns the same File.
 */
export function withMimeType(file: File, mimeTypes: Map<string, string> = DEFAULT_MIME_TYPES): FileWithPath {
  const {name} = file;
  const hasExtension = name && name.lastIndexOf(".") !== -1;

  if (hasExtension && !file.type) {
    const ext = name.split(".").pop()!.toLowerCase();
    const type = mimeTypes.get(ext);
    if (type) {
      Object.defineProperty(file, "type", {
        value: type,
        writable: false,
        configurable: false,
        enumerable: true
      });
    }
  }

  return file as FileWithPath;
}

function setObjProp(f: FileWithPath, key: string, value: string) {
  Object.defineProperty(f, key, {
    value,
    writable: false,
    configurable: false,
    enumerable: true
  });
}
