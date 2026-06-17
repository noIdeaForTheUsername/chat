import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'fileSize',
  standalone: true,
})
export class FileSizePipe implements PipeTransform {
  private readonly units = ['B', 'KB', 'MB', 'GB', 'TB'];

  transform(bytes: number | null | undefined, decimals = 2): string {
    if (bytes == null || isNaN(bytes)) {
      return '-';
    }

    if (bytes === 0) {
      return '0 B';
    }

    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, index);

    return `${size.toFixed(decimals)} ${this.units[index]}`;
  }
}