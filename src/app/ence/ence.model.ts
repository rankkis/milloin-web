/** GET /ence of milloin-server. Times are UTC. */
export interface EnceTeamDto {
  name: string;
  /** Logo path relative to the API root, e.g. ence/logos/3f2a9c0d1b7e4a55 */
  logo?: string;
}

export interface EnceStreamDto {
  name: string;
  platform: string;
  /** fi or en */
  language: string;
  url: string;
  official: boolean;
  viewers?: number;
}

export interface EnceMatchDto {
  startTime: string;
  live: boolean;
  opponent: EnceTeamDto;
  event: string;
  format?: string;
}

export interface EnceNextMatchDto extends EnceMatchDto {
  streams: EnceStreamDto[];
}

export interface EnceResultDto {
  startTime: string;
  opponent: EnceTeamDto;
  event: string;
  teamScore: number;
  opponentScore: number;
}

export interface EnceNewsDto {
  title: string;
  source?: string;
  url: string;
  publishedAt: string;
}

export interface EnceDto {
  updatedAt: string;
  source: string;
  team: EnceTeamDto;
  nextMatch?: EnceNextMatchDto;
  upcoming: EnceMatchDto[];
  results: EnceResultDto[];
  news: EnceNewsDto[];
}
