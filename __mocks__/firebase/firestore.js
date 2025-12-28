module.exports = {
  getFirestore: jest.fn(() => ({})),
  doc: jest.fn(() => ({})),
  getDoc: jest.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({}),
    })
  ),
  setDoc: jest.fn(() => Promise.resolve()),
  updateDoc: jest.fn(() => Promise.resolve()),
  deleteDoc: jest.fn(() => Promise.resolve()),
  collection: jest.fn(() => ({})),
  query: jest.fn(() => ({})),
  where: jest.fn(() => ({})),
  orderBy: jest.fn(() => ({})),
  limit: jest.fn(() => ({})),
  getDocs: jest.fn(() =>
    Promise.resolve({
      docs: [],
      forEach: jest.fn(),
    })
  ),
  onSnapshot: jest.fn(),
  addDoc: jest.fn(() => Promise.resolve({ id: 'test-id' })),
  serverTimestamp: jest.fn(() => new Date()),
};
