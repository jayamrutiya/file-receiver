import express from "express";
import { TYPES } from "../config/types";
import { iocContainer as Container } from "../config/container";
import { IFileReceiverService } from "../interfaces/IFileReceiverService";
import FileReceiverController from "../controllers/FileReceiverController";
import { upload } from "../middlewares/multer";
import fileReceiverValidator from "../validators/file-receiver.validator";

const router = express.Router();

const filereceiverService = Container.get<IFileReceiverService>(
  TYPES.FileReceiverService
);

const filereceiverController = new FileReceiverController(filereceiverService);

router.post("/", upload.single("file"), fileReceiverValidator, (req, res) =>
  filereceiverController.fileManager(req, res)
);

export default router;
