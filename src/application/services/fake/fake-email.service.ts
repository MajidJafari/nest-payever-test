import { Injectable } from '@nestjs/common';
import { ISender } from '../../../domain/interfaces/sender.interface';

@Injectable()
export class FakeEmailService implements ISender {
  async send(email: string) {
    console.log(`Email sent to: ${email}`);
  }
}
