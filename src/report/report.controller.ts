import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get()
  async getReport(@Query() query: ReportQueryDto) {
    return this.reportService.getUsersReport(query);
  }

  @Get('graph')
  async getGraph(@Query() query: ReportQueryDto) {
    return this.reportService.getGraphData(query);
  }

  @Get('pizza')
  async getPie(@Query() query: ReportQueryDto) {
    return this.reportService.getPieData(query);
  }
}
