export interface IFileReceiverService {
  fileManager(tailNumber: string, file: any): Promise<any>;
}
