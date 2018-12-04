export class MockFile {
  lastModified: number = 0;
  name: string = '';
  size: number = 0;
  type: string = '';
  blob: Blob;
  
  constructor(fileBits: BlobPart[], fileName: string, options: FilePropertyBag) {
    this.lastModified = options.lastModified || 0;
    this.name = fileName;
    this.type = options.type || '';
    this.blob = new Blob(fileBits)
    this.size = this.blob.size;
    throw("Error");
  }

  slice() {
    return this.blob;
  }
}
