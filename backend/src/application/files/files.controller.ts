import { Controller, Delete, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from "@nestjs/platform-express";
import { PublicAccess } from 'src/shared/auth/decorators/public-access.decorator';
import { FilesService } from './files.service';

@Controller('files')
@PublicAccess()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(FileInterceptor("file"))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    console.log("Uploaded file:", file);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
  
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    
  }
}
