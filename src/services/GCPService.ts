import { InternalServerError } from "../errors/InternalServerError";
import { IGCPService } from "../interfaces/IGCPService";
import { Storage } from "@google-cloud/storage";
import { PubSub } from "@google-cloud/pubsub";
import env from "../config/env";
import { inject, injectable } from "inversify";
import { IDatabaseService } from "../interfaces/IDatabaseService";
import { TYPES } from "../config/types";
import { Documents } from "db-sdk/dist/Documents";
import { DocumentAuditTrail } from "db-sdk/dist/DocumentAuditTrail";
import { FileStatusEnum } from "db-sdk/dist/Enum";

const storage = new Storage(env.GCP_CONFIG);
const bucketName = env.GCP_BUCKET_NAME;
const gcs = storage.bucket(bucketName!);
const pubsub = new PubSub(env.GCP_CONFIG);

@injectable()
export class GCPService implements IGCPService {
  private _databaseService: IDatabaseService;
  constructor(
    @inject(TYPES.DatabaseService) databaseService: IDatabaseService
  ) {
    this._databaseService = databaseService;
    console.log(`Creating: ${this.constructor.name}`);
  }

  async uploadFileOnBucket(
    filePath: string,
    destinationDir: string
  ): Promise<any> {
    try {
      const upload = await gcs.upload(filePath, {
        destination: destinationDir,
      });
      //ToDo: Update Entry in file_master and create entry in file_process_details with status - STORE_TO_BUCKET
      //Data Needed to be update in both table
      /**
       * file_master: id, status, stagingAreaPath
       *
       * file_process_details: fileId, status, description, time, createdAt
       */
      return upload;
    } catch (error) {
      //ToDo: Update Entry in file_master and create entry in file_process_details with status - FAILED
      //Data Needed to be update in both table
      /**
       * file_master: id, status
       *
       * file_process_details: fileId, status, description, time, createdAt
       */
      throw new InternalServerError(
        "An error occurred while interacting with the uploadFileOnBucket service." +
          error
      );
    }
  }

  async sendMessageTOPubSub(
    payload: any,
    topicName: string,
    id: number
  ): Promise<any> {
    const db = await this._databaseService.connect();
    const documentEntity = await db.getEntity(Documents);
    const documentAuditTrailEntity = await db.getEntity(DocumentAuditTrail);
    const document = await documentEntity.findOne({
      where: {
        id,
      },
    });
    try {
      const payloadBuffer = Buffer.from(JSON.stringify(payload));
      const sendMessage = await pubsub
        .topic(topicName)
        .publishMessage({ data: payloadBuffer });

      // update file status in document table
      document.status = FileStatusEnum["PUSH_TO_QUEUE"];
      await documentEntity.save(document);

      // create file status record in document audit table
      const documentAuditTrail = new DocumentAuditTrail();
      documentAuditTrail.status = FileStatusEnum["PUSH_TO_QUEUE"];
      documentAuditTrail.documentId = id;
      documentAuditTrail.description = "trying to win a little everyday";
      documentAuditTrail.time = new Date();
      await db.saveEntity(documentAuditTrailEntity, documentAuditTrail);

      return sendMessage;
    } catch (error) {
      document.status = FileStatusEnum["FAILED"];
      await documentEntity.save(document);

      // create file status = FAILED record in document audit table
      const documentAuditTrail = new DocumentAuditTrail();
      documentAuditTrail.status = FileStatusEnum["FAILED"];
      documentAuditTrail.documentId = id;
      documentAuditTrail.description = "trying to win a little everyday";
      documentAuditTrail.time = new Date();
      await db.saveEntity(documentAuditTrailEntity, documentAuditTrail);

      throw new InternalServerError(
        "An error occurred while interacting with the sendMessageTOPubSub service." +
          error
      );
    }
  }
}
