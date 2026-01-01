import { Test, TestingModule } from '@nestjs/testing';
import { StorageController } from './storage.controller';
import { StorageService } from './storage.service';

describe('StorageController', () => {
  let controller: StorageController;
  let storageService: StorageService;

  const mockStorageService = {
    uploadFile: jest.fn(),
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StorageController],
      providers: [
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
      ],
    }).compile();

    controller = module.get<StorageController>(StorageController);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadUserProfilePicture', () => {
    it('should upload user profile picture to correct folder', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'profile.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('test'),
        size: 4,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const expectedResult = {
        url: 'https://test.r2.dev/users/profile-pictures/uuid.jpg',
        key: 'users/profile-pictures/uuid.jpg',
      };

      mockStorageService.uploadFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadUserProfilePicture(mockFile);

      expect(result).toEqual(expectedResult);
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'users/profile-pictures',
      );
    });
  });

  describe('uploadCompanyProfilePicture', () => {
    it('should upload company logo to correct folder', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'logo.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
        size: 4,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const expectedResult = {
        url: 'https://test.r2.dev/companies/logos/uuid.png',
        key: 'companies/logos/uuid.png',
      };

      mockStorageService.uploadFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadCompanyProfilePicture(mockFile);

      expect(result).toEqual(expectedResult);
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'companies/logos',
      );
    });
  });

  describe('uploadComplaintFile', () => {
    it('should upload complaint attachment to correct folder', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'document.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: Buffer.from('test'),
        size: 4,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const expectedResult = {
        url: 'https://test.r2.dev/complaints/attachments/uuid.pdf',
        key: 'complaints/attachments/uuid.pdf',
      };

      mockStorageService.uploadFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadComplaintFile(mockFile);

      expect(result).toEqual(expectedResult);
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'complaints/attachments',
      );
    });

    it('should handle image uploads for complaints', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'screenshot.png',
        encoding: '7bit',
        mimetype: 'image/png',
        buffer: Buffer.from('test'),
        size: 4,
        stream: null as any,
        destination: '',
        filename: '',
        path: '',
      };

      const expectedResult = {
        url: 'https://test.r2.dev/complaints/attachments/uuid.png',
        key: 'complaints/attachments/uuid.png',
      };

      mockStorageService.uploadFile.mockResolvedValue(expectedResult);

      const result = await controller.uploadComplaintFile(mockFile);

      expect(result).toEqual(expectedResult);
      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        mockFile,
        'complaints/attachments',
      );
    });
  });
});
