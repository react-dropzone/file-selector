export class UnexpectedObjectError extends Error {
    item: DataTransferItem;
    constructor(item: DataTransferItem) {
        super('DataTransferItem is not a file');
        this.item = item;
        this.name = 'UnexpectedObjectError';
    }
}
