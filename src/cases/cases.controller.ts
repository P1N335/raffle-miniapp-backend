import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CasesService } from './cases.service';
import { OpenCaseDto } from './dto/open-case.dto';

@Controller('cases')
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Get()
  findAll() {
    return this.casesService.findAll();
  }

  @Get('openings')
  findOpenings(
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.casesService.findOpenings(
      userId,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.casesService.findOne(slug);
  }

  @Post(':slug/open')
  openCase(@Param('slug') slug: string, @Body() dto: OpenCaseDto) {
    return this.casesService.openCase(slug, dto.userId);
  }
}
