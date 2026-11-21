export enum CtiTargetType {
  DOMAIN = 'DOMAIN',
  IP = 'IP',
  URL = 'URL',
  ONION = 'ONION',
  EMAIL = 'EMAIL',
  USERNAME = 'USERNAME',
  PHONE = 'PHONE',
  FILE_HASH = 'FILE_HASH',
  CRYPTO_WALLET = 'CRYPTO_WALLET',
  ASN = 'ASN',
  THREAT_ACTOR = 'THREAT_ACTOR',
  ORGANIZATION = 'ORGANIZATION',
  CVE = 'CVE',
  KEYWORD = 'KEYWORD',
  TELEGRAM_CHANNEL = 'TELEGRAM_CHANNEL',
  APP_PACKAGE = 'APP_PACKAGE',
}

export enum CtiTargetSource {
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  DISCOVERY = 'DISCOVERY',
}

export enum CtiInvestigationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum CtiRelationType {
  USES = 'uses',
  COMMUNICATES_WITH = 'communicates-with',
  ATTRIBUTED_TO = 'attributed-to',
  FUNDED_BY = 'funded-by',
  HOSTS = 'hosts',
  RESOLVES_TO = 'resolves-to',
  RELATED_TO = 'related-to',
  PART_OF = 'part-of',
  TARGETS = 'targets',
  DISTRIBUTES = 'distributes',
}
