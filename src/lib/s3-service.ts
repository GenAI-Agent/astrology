import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION || "ap-northeast-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
    this.bucketName = process.env.S3_BUCKET_NAME || "lens-audio";
  }

  /**
   * 上傳語音文件到S3
   * 路徑格式: {user_id}/personal_voice_package/voice_clone_folder/{voice_package_id}/{user_voice_id}_{emotion}.{ext}
   * 其中 ext 為原始檔案的副檔名 (mp3 或 wav)
   */
  async uploadVoiceFile(
    file: Buffer,
    userId: string,
    voicePackageId: string,
    userVoiceId: string,
    emotion: string,
    originalFileName: string
  ): Promise<string> {
    const fileExtension = originalFileName.split('.').pop()?.toLowerCase() || 'wav';
    const key = `${userId}/personal_voice_package/voice_clone_folder/${voicePackageId}/${userVoiceId}_${emotion}.${fileExtension}`;
    
    // Set correct content type
    const contentType = fileExtension === 'mp3' ? 'audio/mpeg' : 'audio/wav';
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
      Metadata: {
        userId,
        voicePackageId,
        userVoiceId,
        emotion,
        originalFileName: encodeURIComponent(originalFileName),
      },
    });

    await this.s3Client.send(command);
    return `s3://${this.bucketName}/${key}`;
  }

  /**
   * 獲取預簽名URL用於前端直接上傳
   */
  async getPresignedUploadUrl(
    userId: string,
    voicePackageId: string,
    userVoiceId: string,
    emotion: string,
    fileExtension: string
  ): Promise<{ url: string; key: string }> {
    const key = `${userId}/personal_voice_package/voice_clone_folder/${voicePackageId}/${userVoiceId}_${emotion}.${fileExtension}`;
    
    // Set correct content type
    const contentType = fileExtension.toLowerCase() === 'mp3' ? 'audio/mpeg' : 'audio/wav';
    
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    return { url, key };
  }

  /**
   * 獲取文件的預簽名下載URL
   */
  async getPresignedDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
  }

  /**
   * 檢查S3文件是否存在
   */
  async fileExists(s3Path: string): Promise<boolean> {
    try {
      const key = S3Service.extractKeyFromS3Path(s3Path);
      
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  /**
   * 刪除S3文件
   */
  async deleteFile(s3Path: string): Promise<void> {
    const key = S3Service.extractKeyFromS3Path(s3Path);
    
    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  /**
   * 通用文件上傳方法
   */
  async uploadFile(
    file: Buffer,
    key: string,
    contentType?: string
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    await this.s3Client.send(command);
    return `s3://${this.bucketName}/${key}`;
  }

  /**
   * 從S3路徑中提取key
   */
  static extractKeyFromS3Path(s3Path: string): string {
    // 處理不同格式的S3路徑
    if (s3Path.startsWith('s3://')) {
      // 標準 S3 路徑: s3://bucket/key
      const parts = s3Path.split('/');
      return parts.slice(3).join('/'); // 移除 s3://bucket/ 部分
    } else if (s3Path.startsWith('https://')) {
      // HTTPS URL 格式: https://bucket.s3.region.amazonaws.com/key
      const url = new URL(s3Path);
      return url.pathname.substring(1); // 移除開頭的 /
    } else {
      // 假設已經是 key
      return s3Path;
    }
  }
} 