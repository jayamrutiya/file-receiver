import multer from "multer";
import MulterGoogleCloudStorage from "multer-cloud-storage";
import env from "../config/env";
import { Storage } from "@google-cloud/storage";

const storage = new Storage(env.GCP_CONFIG);
const bucketName = env.GCP_BUCKET_NAME;

export const upload = multer({
  storage: new MulterGoogleCloudStorage({
    bucket: bucketName,
    projectId: env.GCP_CONFIG.projectId,
    credentials: env.GCP_CONFIG.credentials,
    destination: (req: any, file: any, cb: any) => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const date = currentDate.getDate();
      cb(null, `QAR/${req.body.tailNumber}/${year}/${month}/${date}/`);
    },
    filename: (req: any, file: any, cb: any) => {
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const date = currentDate.getDate();
      cb(null, `${file.originalname.replace(" ", "")}`);
    },
  }),
});
