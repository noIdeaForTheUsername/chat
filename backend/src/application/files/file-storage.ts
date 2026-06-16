import multer from 'multer';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

export function getFileDiskStorage(configService: ConfigService) {
  return multer.diskStorage({
    destination: configService.getOrThrow("files.uploadsDirectory"),
    filename: (req, file, cb) => {
      cb(null, randomUUID() + ".blob");
    }
  });
}
