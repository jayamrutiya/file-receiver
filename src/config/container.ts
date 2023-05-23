import { Container } from "inversify";
import { buildProviderModule } from "inversify-binding-decorators";
import { TYPES } from "./types";
import { ISFTPService } from "../interfaces/ISFTPService";
import { SFTPService } from "../services/SFTPService";
import { IFileReceiverService } from "../interfaces/IFileReceiverService";
import { FileReceiverService } from "../services/FileReceiverService";
import { IGCPService } from "../interfaces/IGCPService";
import { GCPService } from "../services/GCPService";
import { IDatabaseService } from "../interfaces/IDatabaseService";
import { DatabaseService } from "./db";

const iocContainer = new Container();

// make inversify aware of inversify-binding-decorators
iocContainer.load(buildProviderModule());

// Services
iocContainer.bind<IDatabaseService>(TYPES.DatabaseService).to(DatabaseService);
iocContainer.bind<ISFTPService>(TYPES.SFTPService).to(SFTPService);
iocContainer
  .bind<IFileReceiverService>(TYPES.FileReceiverService)
  .to(FileReceiverService);
iocContainer.bind<IGCPService>(TYPES.GCPService).to(GCPService);

export { iocContainer };
