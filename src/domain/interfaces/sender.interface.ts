import { EnvironmentTypes } from '../enums/environment-types';
import { SenderTypes } from '../enums/sender-types';

export interface ISender {
  send(message: string, recipient: string): Promise<void>;
}

export interface ISenderFactory {
  getSender(env: EnvironmentTypes, type: SenderTypes): ISender;
}
