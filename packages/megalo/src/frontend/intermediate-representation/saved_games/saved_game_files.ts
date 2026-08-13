export interface ContentItemHistory {
  isOnline: boolean;
  name: string;
  timestamp: Date;
  xuid: bigint;
}

export interface ContentItemGeneralMetadata {
  gameEngineType: number;
  gameMode: number;
}

export interface ContentItemMetadata {
  creationHistory: ContentItemHistory;
  description?: string;
  general: ContentItemGeneralMetadata;
  modificationHistory: ContentItemHistory;
  name?: string;
}
