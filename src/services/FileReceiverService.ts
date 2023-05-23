import { inject, injectable } from "inversify";
import { IFileReceiverService } from "../interfaces/IFileReceiverService";
import { InternalServerError } from "../errors/InternalServerError";
import { IGCPService } from "../interfaces/IGCPService";
import { TYPES } from "../config/types";
import env from "../config/env";
import { IDatabaseService } from "../interfaces/IDatabaseService";
import { Documents } from "db-sdk/dist/Documents";
import { DocumentAuditTrail } from "db-sdk/dist/DocumentAuditTrail";
import { FileStatusEnum } from "db-sdk/dist/Enum";

const bucketName = env.GCP_BUCKET_NAME;
@injectable()
export class FileReceiverService implements IFileReceiverService {
  private _gcpService: IGCPService;
  private _databaseService: IDatabaseService;
  constructor(
    @inject(TYPES.GCPService) gcpService: IGCPService,
    @inject(TYPES.DatabaseService) databaseService: IDatabaseService
  ) {
    this._gcpService = gcpService;
    this._databaseService = databaseService;
    console.log(`Creating: ${this.constructor.name}`);
  }

  async fileManager(tailNumber: string, file: any, id: number): Promise<any> {
    const db = await this._databaseService.connect();
    const documentEntity = await db.getEntity(Documents);
    const documentAuditTrailEntity = await db.getEntity(DocumentAuditTrail);
    const document = await documentEntity.findOne({
      where: {
        id,
      },
    });
    try {
      // update file status in document table
      document.status = FileStatusEnum["STORE_TO_BUCKET"];
      document.stagingAreaPath = file.linkUrl;
      await documentEntity.save(document);

      // create file status record in document audit table
      const documentAuditTrail = new DocumentAuditTrail();
      documentAuditTrail.status = FileStatusEnum["STORE_TO_BUCKET"];
      documentAuditTrail.documentId = id;
      documentAuditTrail.description = "trying to win a little everyday";
      documentAuditTrail.time = new Date();
      await db.saveEntity(documentAuditTrailEntity, documentAuditTrail);

      const payload = {
        fileType: "QAR",
        // fileType: fileName.includes("QAR") ? "QAR" : "ODW",
        fileName: file.originalname,
        bucketName,
        fileLocation: file.linkUrl,
      };

      console.log(`Queue Message: ${JSON.stringify(payload)}`);

      const sendMessage = await this._gcpService.sendMessageTOPubSub(
        payload,
        "ge-queue",
        id
      );

      console.log(`Message Id: ${sendMessage}`);

      return file;
    } catch (error) {
      console.log("Errrrr", error);
      // // update file status = FAILED in document table
      // document.status = FileStatusEnum["FAILED"];
      // await documentEntity.save(document);

      // // create file status = FAILED record in document audit table
      // const documentAuditTrail = new DocumentAuditTrail();
      // documentAuditTrail.status = FileStatusEnum["FAILED"];
      // documentAuditTrail.documentId = id;
      // documentAuditTrail.description = "trying to win a little everyday";
      // documentAuditTrail.time = new Date();
      // await db.saveEntity(documentAuditTrailEntity, documentAuditTrail);

      throw new InternalServerError(
        "An error occurred while interacting with the fileManager service." +
          error
      );
    }
  }
}
