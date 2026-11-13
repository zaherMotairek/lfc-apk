import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ContentService } from './content.service';

@Injectable()
export class NewsletterSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(NewsletterSchedulerService.name);
  private ticking = false;

  constructor(private readonly contentService: ContentService) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test' || process.env.DISABLE_NEWSLETTER_SCHEDULER === 'true') {
      return;
    }

    const run = () => {
      if (this.ticking) return;
      this.ticking = true;
      void this.contentService
        .processNewsletterJobs()
        .catch((err) =>
          this.logger.warn(
            `Newsletter job failed: ${err instanceof Error ? err.message : String(err)}`,
          ),
        )
        .finally(() => {
          this.ticking = false;
        });
    };

    run();
    setInterval(run, 60_000);
  }
}
