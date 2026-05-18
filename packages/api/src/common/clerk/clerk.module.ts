import { Global, Module } from '@nestjs/common'
import { ClerkMetadataService } from './clerk-metadata.service'

@Global()
@Module({
  providers: [ClerkMetadataService],
  exports: [ClerkMetadataService],
})
export class ClerkModule {}
