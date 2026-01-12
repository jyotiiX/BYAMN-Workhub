import { sanitizeInput, isValidUrl, isValidEmail } from './utils';

describe('Utils Functions', () => {
  describe('sanitizeInput', () => {
    it('should sanitize malicious script tags', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).toBe('');
    });

    it('should remove javascript protocol', () => {
      const maliciousInput = 'javascript:alert(1)';
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).toBe('');
    });

    it('should remove event handlers', () => {
      const maliciousInput = 'onclick="alert(1)"';
      const sanitized = sanitizeInput(maliciousInput);
      expect(sanitized).toBe('');
    });

    it('should remove HTML tags', () => {
      const input = '<div>Hello World</div>';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Hello World');
    });

    it('should handle normal text correctly', () => {
      const input = 'Hello World';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Hello World');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const sanitized = sanitizeInput(input);
      expect(sanitized).toBe('Hello World');
    });

    it('should handle non-string input', () => {
      // @ts-expect-error Testing invalid input type
      const sanitized = sanitizeInput(123);
      expect(sanitized).toBe('');
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      const url = 'http://example.com';
      expect(isValidUrl(url)).toBe(true);
    });

    it('should return true for valid HTTPS URLs', () => {
      const url = 'https://example.com';
      expect(isValidUrl(url)).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      const url = 'not-a-url';
      expect(isValidUrl(url)).toBe(false);
    });

    it('should return false for javascript protocol', () => {
      const url = 'javascript:alert(1)';
      expect(isValidUrl(url)).toBe(false);
    });

    it('should return false for other protocols', () => {
      const url = 'ftp://example.com';
      expect(isValidUrl(url)).toBe(false);
    });
  });

  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      const email = 'test@example.com';
      expect(isValidEmail(email)).toBe(true);
    });

    it('should return false for invalid email addresses', () => {
      const email = 'invalid-email';
      expect(isValidEmail(email)).toBe(false);
    });

    it('should return false for emails without domain', () => {
      const email = 'test@';
      expect(isValidEmail(email)).toBe(false);
    });

    it('should return false for emails without @ symbol', () => {
      const email = 'testexample.com';
      expect(isValidEmail(email)).toBe(false);
    });
  });
});