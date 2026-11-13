import { Controller, Get, Header } from '@nestjs/common';
import { BrandService } from './brand.service';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  getBrand() {
    return this.brandService.getPublicBrand();
  }

  @Get('manifest.webmanifest')
  @Header('Content-Type', 'application/manifest+json')
  @Header('Cache-Control', 'public, max-age=300')
  getManifest() {
    return this.brandService.buildWebManifest();
  }
}
