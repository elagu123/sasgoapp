// Test setup configuration for SASGOAPP

import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeAll, afterAll, vi } from 'vitest'
import 'whatwg-fetch'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock environment variables
beforeAll(() => {
  vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3001')
  vi.stubEnv('VITE_GEMINI_API_KEY', 'test-gemini-key')
  vi.stubEnv('REACT_APP_GOOGLE_MAPS_API_KEY', 'test-maps-key')
})

// Restore environment variables
afterAll(() => {
  vi.unstubAllEnvs()
})

// Mock window.matchMedia (for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  value: vi.fn(),
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock Geolocation API
const mockGeolocation = {
  getCurrentPosition: vi.fn(),
  watchPosition: vi.fn(),
  clearWatch: vi.fn(),
}
Object.defineProperty(navigator, 'geolocation', {
  value: mockGeolocation,
})

// Mock Notification API
const mockNotification = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
}))
mockNotification.permission = 'granted'
mockNotification.requestPermission = vi.fn().mockResolvedValue('granted')
Object.defineProperty(window, 'Notification', {
  value: mockNotification,
})

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}))

// Mock File and FileReader for file upload tests
global.File = class File {
  name: string
  size: number
  type: string

  constructor(chunks: (string | BufferSource | Blob)[], filename: string, options?: FilePropertyBag) {
    this.name = filename
    this.size = chunks.reduce((acc, chunk) => acc + (typeof chunk === 'string' ? chunk.length : chunk.byteLength || 0), 0)
    this.type = options?.type || ''
  }
}

global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null
  readyState = 0
  onload: ((event: ProgressEvent<FileReader>) => void) | null = null
  onerror: ((event: ProgressEvent<FileReader>) => void) | null = null

  readAsText(file: Blob) {
    setTimeout(() => {
      this.result = 'mock file content'
      this.readyState = 2
      this.onload?.({} as ProgressEvent<FileReader>)
    }, 0)
  }

  readAsDataURL(file: Blob) {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,bW9jayBmaWxlIGNvbnRlbnQ='
      this.readyState = 2
      this.onload?.({} as ProgressEvent<FileReader>)
    }, 0)
  }
}

// Global test utilities
export const createMockTrip = () => ({
  id: 'test-trip-1',
  title: 'Test Trip',
  destination: ['Barcelona, Spain'],
  dates: { start: '2024-12-01', end: '2024-12-07' },
  travelers: 2,
  budget: 1500,
  pace: 'moderate' as const,
  interests: ['culture', 'food'],
  privacy: 'private' as const,
  members: [{
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'OWNER' as const
  }],
  createdAt: new Date().toISOString(),
  version: 1
})

export const createMockUser = () => ({
  id: 'test-user-1',
  name: 'Test User',
  email: 'test@example.com',
  preferences: {
    travelStyle: 'balanced' as const,
    preferredCategories: ['adventure', 'culture']
  },
  createdAt: new Date().toISOString()
})

export const createMockExpense = () => ({
  id: 'test-expense-1',
  tripId: 'test-trip-1',
  description: 'Hotel Barcelona',
  amount: 150.00,
  category: 'alojamiento' as const,
  date: '2024-12-01',
  createdBy: 'test-user-1',
  createdAt: new Date().toISOString()
})