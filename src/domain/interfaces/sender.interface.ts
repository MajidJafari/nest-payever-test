import { SenderTypes } from '../enums/sender-types';

export interface ISender {
  send(message: string, recipient: string): Promise<void>;
}

export interface ISenderFactory {
  getSender(type: SenderTypes): ISender;
}
