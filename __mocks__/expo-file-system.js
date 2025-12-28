export const cacheDirectory = '/cache/';
export const documentDirectory = '/documents/';
export const bundleDirectory = '/bundle/';

export const getInfoAsync = jest.fn().mockResolvedValue({
  exists: true,
  isDirectory: false,
  size: 1024,
  modificationTime: Date.now(),
});

export const makeDirectoryAsync = jest.fn().mockResolvedValue(true);
export const readAsStringAsync = jest.fn().mockResolvedValue('file content');
export const writeAsStringAsync = jest.fn().mockResolvedValue(true);
export const deleteAsync = jest.fn().mockResolvedValue(true);
export const copyAsync = jest.fn().mockResolvedValue(true);
export const moveAsync = jest.fn().mockResolvedValue(true);
export const downloadAsync = jest.fn().mockResolvedValue({ uri: '/cache/file' });

export const createDownloadResumable = jest.fn().mockReturnValue({
  downloadAsync: jest.fn().mockResolvedValue({ uri: '/cache/file' }),
  pauseAsync: jest.fn().mockResolvedValue(true),
  resumeAsync: jest.fn().mockResolvedValue(true),
  savable: jest.fn().mockReturnValue({}),
});

export const DownloadResumable = {
  createFromOptions: jest.fn(),
};

export default {
  cacheDirectory,
  documentDirectory,
  bundleDirectory,
  getInfoAsync,
  makeDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  copyAsync,
  moveAsync,
  downloadAsync,
  createDownloadResumable,
  DownloadResumable,
};
