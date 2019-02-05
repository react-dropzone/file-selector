export const COMMON_MIME_TYPES = new Map([
    ['avi', 'video/avi'],
    ['gif', 'image/gif'],
    ['ico', 'image/x-icon'],
    ['jpeg', 'image/jpeg'],
    ['jpg', 'image/jpeg'],
    ['mkv', 'video/x-matroska'],
    ['mov', 'video/quicktime'],
    ['mp4', 'video/mp4'],
    ['pdf', 'application/pdf'],
    ['png', 'image/png'],
    ['zip', 'application/zip']
]);


export function toFileWithPath(file: File, path?: string): FileWithPath {
    const f = withMimeType(file);
    Object.defineProperty(f, 'path', {
        value: typeof path === 'string' ? path : file.name,
        writable: false,
        configurable: false
    });
    return f;
}

export interface FileWithPath extends File {
    readonly path?: string;
}


function withMimeType(file: File) {
    const {name} = file;
    const hasExtension = name && name.lastIndexOf('.') !== -1;

    if (name && hasExtension && !file.type) {
        const ext = name.split('.')
            .pop()!.toLowerCase();
        const type = COMMON_MIME_TYPES.get(ext);
        if (type) {
            return clone(file, type);
        }
    }

    return clone(file);
}

export function clone(file: File, fType?: string) {
    const data = file.slice();
    const {name, lastModified} = file;
    const type = fType || file.type;

    try {
        return new File([data], name, {lastModified, type});
    } catch (e) {
        const blob = new Blob([data], {type});
        Object.assign(blob, {name, lastModified});
        return blob as File;
    }
}
