import { Injectable } from '@nestjs/common';
import { CreateFileDto } from './dto/create-file.dto';

// The file upload and writing themseleves are performed by Multer in FileInterceptor.
// This service manages metadata, access and cleanups

@Injectable()
export class FilesService {
  
}
