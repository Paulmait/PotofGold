export const Image = {
  prefetch: jest.fn().mockResolvedValue(true),
  clearDiskCache: jest.fn().mockResolvedValue(true),
  clearMemoryCache: jest.fn().mockResolvedValue(true),
  getCachePathAsync: jest.fn().mockResolvedValue('/cache/image.jpg'),
};

export default Image;