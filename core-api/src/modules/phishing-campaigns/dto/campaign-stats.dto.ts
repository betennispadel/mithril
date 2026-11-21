import { ApiProperty } from '@nestjs/swagger';

export class CampaignStatsDto {
  @ApiProperty() emailsSent: number;
  @ApiProperty() emailsOpened: number;
  @ApiProperty() linksClicked: number;
  @ApiProperty() credsSubmitted: number;
  @ApiProperty() emailsReported: number;
  @ApiProperty() openRate: number;
  @ApiProperty() clickRate: number;
  @ApiProperty() submitRate: number;
  @ApiProperty() reportRate: number;
}
