import {UnexpectedObjectError} from './error';

describe('UnexpectedObjectError', () => {
    it('works as expected', () => {
        const item = {it: 'works'};
        try {
            throw new UnexpectedObjectError(item as any);
        } catch (e: any) {
            expect(e.name).toEqual('UnexpectedObjectError');
            expect(e.toString()).toEqual('UnexpectedObjectError: DataTransferItem is not a file');
            expect(e).toBeInstanceOf(Error);
            expect(e).toBeInstanceOf(UnexpectedObjectError);
            expect(e.item).toEqual(item);
            expect(e.stack).toBeDefined();
        }
    });
});
