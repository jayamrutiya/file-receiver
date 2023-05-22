import { IFileReceiverService } from "../interfaces/IFileReceiverService";
import BaseController from "./BaseController";
import * as express from "express";

export default class FileReceiverController extends BaseController {
  private _filereceiverService: IFileReceiverService;

  constructor(filereceiverService: IFileReceiverService) {
    super();
    this._filereceiverService = filereceiverService;
  }

  async fileManager(req: express.Request, res: express.Response) {
    try {
      // validate input
      this.validateRequest(req);

      const tailNumber = req.body.tailNumber;
      const file = req.file;

      const fileManager = await this._filereceiverService.fileManager(
        tailNumber,
        file
      );

      // Return response
      return this.sendJSONResponse(
        res,
        "File Uploaded Successfully",
        null,
        fileManager
      );
    } catch (error) {
      return this.sendErrorResponse(req, res, error);
    }
  }
}
