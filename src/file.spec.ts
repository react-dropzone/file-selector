import {COMMON_MIME_TYPES, toFileWithPath, clone} from './file';
import {MockFile} from './file.mock';

declare let global: any;

describe('toFile()', () => {
    it('should be an instance of a File', () => {
        const file = new File([], 'test.json');
        const fileWithPath = toFileWithPath(file);
        expect(fileWithPath).toBeInstanceOf(File);
    });

    it('has all the File options', () => {
        const type = 'application/json';
        const opts: FilePropertyBag = {type};
        const file = new File([], 'test.json', opts);
        const fileWithPath = toFileWithPath(file);
        expect(fileWithPath.type).toBe(type);
    });

    it('sets the {path} if provided', () => {
        const path = '/test/test.json';
        const file = new File([], 'test.json');
        const fileWithPath = toFileWithPath(file, path);
        expect(fileWithPath.path).toBe(path);
    });

    it('uses the File {name} as {path} if not provided', () => {
        const name = 'test.json';
        const file = new File([], name);
        const fileWithPath = toFileWithPath(file);
        expect(fileWithPath.path).toBe(name);
    });

    it('sets the {type} from extension', () => {
        const types = Array.from(COMMON_MIME_TYPES.values());
        const files = Array.from(COMMON_MIME_TYPES.keys())
            .map(ext => new File([], `test.${ext}`))
            .map(f => toFileWithPath(f));

        for (const file of files) {
            expect(types.includes(file.type)).toBe(true);
        }
    });

    it('clones the File', () => {
        const opts: FilePropertyBag = {
            type: 'application/json',
            lastModified: 1234567
        };
        const data = JSON.stringify({ping: true});
        const file = new File([data], 'test.json', opts);
        const fwp = toFileWithPath(file);

        expect(fwp === file).toBe(false);
        expect(fwp.name).toEqual(file.name);
        expect(fwp.type).toEqual(file.type);
        expect(fwp.size).toEqual(file.size);
        expect(fwp.lastModified).toEqual(file.lastModified);
    });

    it('clones the File as a blob', () => {
      var global = 
      const opts: FilePropertyBag = {
        type: 'plain/text',
        lastModified: 1234567
      };
      const data = JSON.stringify({ping: true});
      const file = new File([data], 'test.txt', opts);
      global.OriginalFile = File;
      global.File = MockFile;
      const clonedFile = clone(file);
      global.File = (global as any).OriginalFile;      

      expect(clonedFile === file).toBe(false);
      expect(clonedFile.name).toEqual(file.name);
      expect(clonedFile.type).toEqual(file.type);
      expect(clonedFile.size).toEqual(file.size);
      expect(clonedFile.lastModified).toEqual(file.lastModified);
    });
    
    it('should behave like a File', done => {
        const data = {ping: true};
        const json = JSON.stringify(data);
        const file = new File([json], 'test.json');
        const fileWithPath = toFileWithPath(file);

        const reader = new FileReader();
        reader.onload = evt => {
            const {result} = evt.target as any;
            try {
                const d = JSON.parse(result);
                expect(d).toEqual(data);
                done();
            } catch (e) {
                done.fail(e);
            }
        };

        reader.readAsText(fileWithPath);
    });
});
