/**
 * LINE LIFF SDK Mock Factory
 * 
 * ใน production ควรใช้ @line/liff-2 จริง
 * ติดตั้ง: npm install @line/liff-2
 * 
 * ไฟล์นี้เป็น mock สำหรับ development ที่ไม่มี LIFF SDK
 * ใช้ createLiffMock() แทน direct import เพื่อให้ได้ instance ใหม่ทุกครั้ง
 */

export const createLiffMock = () => ({
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
  getOS: () => 'android',
  getVersion: () => '2.23.2'
})

// Legacy default export for backward compatibility
const liffMock = createLiffMock()
export default liffMock
