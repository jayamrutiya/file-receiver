import { inject, injectable } from "inversify";
import { IFileReceiverService } from "../interfaces/IFileReceiverService";
import { InternalServerError } from "../errors/InternalServerError";
import { IGCPService } from "../interfaces/IGCPService";
import { TYPES } from "../config/types";
import env from "../config/env";

const bucketName = env.GCP_BUCKET_NAME;
@injectable()
export class FileReceiverService implements IFileReceiverService {
  private _gcpService: IGCPService;
  constructor(@inject(TYPES.GCPService) gcpService: IGCPService) {
    this._gcpService = gcpService;
    console.log(`Creating: ${this.constructor.name}`);
  }

  async fileManager(tailNumber: string, file: any): Promise<any> {
    try {
      const payload = {
        fileType: "QAR",
        // fileType: fileName.includes("QAR") ? "QAR" : "ODW",
        fileName: file.originalname,
        bucketName,
        fileLocation: file.linkUrl,
      };

      const sendMessage = await this._gcpService.sendMessageTOPubSub(
        payload,
        "ge-queue"
      );

      return file;
    } catch (error) {
      throw new InternalServerError(
        "An error occurred while interacting with the fileManager service." +
          error
      );
    }
  }
}
