export interface IFileReceiverService {
  fileManager(tailNumber: string, file: any, id: number): Promise<any>;
}
