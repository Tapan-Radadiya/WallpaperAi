import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { MailController } from './mail.controller';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: {
          host: process.env.SMTP_HOST!,
          port: parseInt(process.env.SMTP_PORT!),
          secure: process.env.SMTP_SECURE === 'true',
          tls: {
            rejectUnauthorized: false
          },
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          },
          defaults: {
            from: '"No Reply" <noreply@example.com>',
          },
          logger: true
        },
        defaults: {
          from: process.env.SMTP_USER!
        },
        template: {
          dir: __dirname + '../../../EmailTemplates',
          adapter: new PugAdapter(),
          options: {
            strict: true
          }
        }
      })
    }),
  ],
  providers: [MailService],
  exports: [MailService],
  controllers: [MailController]
})
export class MailModule { }
