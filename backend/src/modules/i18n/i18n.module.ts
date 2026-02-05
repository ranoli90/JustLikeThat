import { Module, Global } from '@nestjs/common';
import { I18nService } from './services/i18n.service';
import { TranslationService } from './services/translation.service';
import { LocaleService } from './services/locale.service';
import { LanguageDetectionService } from './services/language-detection.service';
import { TranslationMemoryService } from './services/translation-memory.service';
import { GlossaryService } from './services/glossary.service';
import { TranslationWorkflowService } from './services/translation-workflow.service';
import { I18nController } from './controllers/i18n.controller';
import { TranslationController } from './controllers/translation.controller';
import { LanguageController } from './controllers/language.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [I18nController, TranslationController, LanguageController],
  providers: [
    I18nService,
    TranslationService,
    LocaleService,
    LanguageDetectionService,
    TranslationMemoryService,
    GlossaryService,
    TranslationWorkflowService,
  ],
  exports: [
    I18nService,
    TranslationService,
    LocaleService,
    LanguageDetectionService,
    TranslationMemoryService,
    GlossaryService,
    TranslationWorkflowService,
  ],
})
export class I18nModule {}
