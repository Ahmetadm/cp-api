import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Mock the S3Client
jest.mock('@aws-sdk/client-s3', () => {
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: jest.fn().mockResolvedValue({}),
    })),
    PutObjectCommand: jest.fn(),
    DeleteObjectCommand: jest.fn(),
  };
});

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-1234'),
}));

describe('StorageService', () => {
  let service: StorageService;
  let mockS3Send: jest.Mock;

  beforeEach(async () => {
    // Set environment variables
    process.env.R2_ACCOUNT_ID = 'test-account-id';
    process.env.R2_ACCESS_KEY_ID = 'test-access-key';
    process.env.R2_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.R2_BUCKET_NAME = 'test-bucket';
    process.env.R2_PUBLIC_URL = 'https://test-bucket.r2.dev';

    const module: TestingModule = await Test.createTestingModule({
      providers: [StorageService],
    }).compile();

    service = module.get<StorageService>(StorageService);

    // Get the mock send function
    mockS3Send = (S3Client as jest.Mock).mock.results[0]?.value?.send;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file and return url and key', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test content'),
        size: 12,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile, 'users/profile-pictures');

      expect(result).toEqual({
        url: 'https://test-bucket.r2.dev/users/profile-pictures/mock-uuid-1234.jpg',
        key: 'users/profile-pictures/mock-uuid-1234.jpg',
      });
      expect(PutObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: 'users/profile-pictures/mock-uuid-1234.jpg',
        Body: mockFile.buffer,
        ContentType: 'image/jpeg',
      });
    });

    it('should handle files with different extensions', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('pdf content'),
        size: 11,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const result = await service.uploadFile(mockFile, 'complaints/attachments');

      expect(result.key).toBe('complaints/attachments/mock-uuid-1234.pdf');
    });

    it('should throw error when upload fails', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 4,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      // Create a new service instance with failing S3 client
      (S3Client as jest.Mock).mockImplementationOnce(() => ({
        send: jest.fn().mockRejectedValue(new Error('Upload failed')),
      }));

      const failingModule: TestingModule = await Test.createTestingModule({
        providers: [StorageService],
      }).compile();

      const failingService = failingModule.get<StorageService>(StorageService);

      await expect(failingService.uploadFile(mockFile, 'test')).rejects.toThrow('Upload failed');
    });
  });

  describe('deleteFile', () => {
    it('should delete a file successfully', async () => {
      const key = 'users/profile-pictures/some-file.jpg';

      await expect(service.deleteFile(key)).resolves.not.toThrow();
      expect(DeleteObjectCommand).toHaveBeenCalledWith({
        Bucket: 'test-bucket',
        Key: key,
      });
    });

    it('should throw error when delete fails', async () => {
      // Create a new service instance with failing S3 client
      (S3Client as jest.Mock).mockImplementationOnce(() => ({
        send: jest.fn().mockRejectedValue(new Error('Delete failed')),
      }));

      const failingModule: TestingModule = await Test.createTestingModule({
        providers: [StorageService],
      }).compile();

      const failingService = failingModule.get<StorageService>(StorageService);

      await expect(failingService.deleteFile('some-key')).rejects.toThrow('Delete failed');
    });
  });
});
