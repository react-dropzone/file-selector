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
            .pop()!;
        const type = COMMON_MIME_TYPES.get(ext);
        if (type) {
            return clone(file, type);
        }
    }

    return clone(file);
}

function clone(file: File, type?: string) {
    const data = file.slice();

    // Edge Hack
    // ---------
    // Edge doesn't support File constructor so instead we're using Blob and filling missing fields so it
    // will look like a File
    if (typeof window.navigator.msSaveBlob !== 'undefined') {
        const blob = new Blob([data], { type: type || file.type });

        // @ts-ignore
        blob.name = file.name;

        // @ts-ignore
        blob.lastModified = file.lastModified;
        return blob as File;
    }

    return new File([data], file.name, {
        lastModified: file.lastModified,
        type: type || file.type
    });
}
