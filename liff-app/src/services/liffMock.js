/**
 * LINE LIFF SDK Mock
 * 
 * ใน production ควรใช้ @line/liff-2 จริง
 * ติดตั้ง: npm install @line/liff-2
 * 
 * ไฟล์นี้เป็น mock สำหรับ development ที่ไม่มี LIFF SDK
 */

const liffMock = {
  isLoggedIn: () => true,
  login: () => {},
  logout: () => {},
  closeWindow: () => {},
  init: async () => {},
  getProfile: async () => ({
    userId: 'U1234567890',
    displayName: 'Demo User',
    pictureUrl: null,
    statusMessage: null
  }),
  scanCode: async () => ({ value: '/scan/plant/M-001' }),
  openWindow: () => {},
  getAccessToken: () => 'mock-access-token',
  getContext: () => null,
  isInClient: () => true,
 Os: () => 'android',
  getVersion: () => '2.23.2'
}

export default liffMock
