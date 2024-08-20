import { Inject, Injectable } from '@nestjs/common';
import { IAvatarRepository } from '../../domain/repositories/avatar.repository';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as https from 'https';
import { IAvatar } from 'src/domain/interfaces/avatar.interface';

@Injectable()
export class AvatarService {
  private readonly storagePath = './storage/avatars';

  constructor(
    @(Inject('AvatarRepository') as any)
    private readonly avatarRepository: IAvatarRepository,
  ) {}

  async getAvatar(
    userId: string,
    url: string,
  ): Promise<{ isVerified: boolean; base64Avatar: string }> {
    const filePath = this.getFilePath(userId);
    let avatar = await this.avatarRepository.findByUserId(userId);
    if (avatar) {
      if (!fs.existsSync(filePath)) {
        await this.storeAvatar(userId, url);
      }
      const hash = avatar.hash;
      const { isVerified, fileHash } = await this.verifyHash(filePath, hash);
      if (!isVerified) {
        // Log for further reference
        console.log('Hash verification failed.', {
          hash,
          fileHash,
        });
        return { isVerified: false, base64Avatar: '' };
      }
    } else {
      await this.storeAvatar(userId, url);
      const hash = await this.createHash(filePath);
      avatar = await this.saveAvatar(userId, hash);
    }
    const imageBuffer = fs.readFileSync(filePath);
    return { isVerified: true, base64Avatar: imageBuffer.toString('base64') };
  }

  async saveAvatar(userId: string, hash: string): Promise<IAvatar> {
    return this.avatarRepository.save({
      userId,
      hash,
    });
  }

  async deleteAvatar(userId: string): Promise<void> {
    const filePath = this.getFilePath(userId);
    const avatar = await this.avatarRepository.findByUserId(userId);
    if (avatar) {
      fs.unlinkSync(filePath);
      await this.avatarRepository.deleteByUserId(userId);
    }
  }

  public async storeAvatar(userId: string, url: string): Promise<void> {
    const filePath = this.getFilePath(userId);
    // fs.writeFileSync(filePath, '');
    const fileStream = fs.createWriteStream(filePath);
    return new Promise((resolve, reject) => {
      https
        .get(url, (response) => {
          response.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            resolve();
          });
        })
        .on('error', (err) => {
          // Handle errors
          fs.unlink(filePath, () => {}); // Delete the file if error occurs
          console.error(`Error downloading the file: ${err.message}`);
          reject(err);
        });
    });
  }

  public getFilePath(userId: string) {
    return path.join(this.storagePath, `${userId}.jpg`);
  }

  public async createHash(filePath: string): Promise<string> {
    const fileStream = fs.createReadStream(filePath);
    const fileHash = crypto.createHash('sha512');
    return new Promise((resolve, reject) => {
      fileStream.on('data', (chunk) => {
        fileHash.update(chunk);
      });
      fileStream.on('end', () => {
        fileStream.close();
        resolve(fileHash.digest('hex'));
      });
      fileStream.on('error', (err) => {
        console.error(
          'File stream for creating hash aborted due to an error:',
          err,
        );
        fileStream.destroy(err);
        reject(err);
      });
    });
  }

  public async verifyHash(filePath: string, hash: string) {
    const fileHash = await this.createHash(filePath);
    return {
      fileHash,
      isVerified: fileHash === hash,
    };
  }
}
