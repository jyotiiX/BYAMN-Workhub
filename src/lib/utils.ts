export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  // Check if the entire input is a malicious protocol
  if (/^(javascript|vbscript):/i.test(input.trim())) {
    return '';
  }
  
  // Remove script tags (case insensitive)
  let result = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove javascript: and vbscript: protocols (case insensitive)
  result = result.replace(/javascript:/gi, '');
  result = result.replace(/vbscript:/gi, '');
  
  // Remove event handlers (case insensitive)
  result = result.replace(/on\w+\s*=\s*["']?[^"'\s>]*["']?/gi, '');
  
  // Remove all HTML tags
  result = result.replace(/<[^>]*>/g, '');
  
  return result.trim();
}

export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidName(name: string): boolean {
  // Names should only contain letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(name) && name.trim().length >= 2 && name.trim().length <= 50;
}

export function isValidBio(bio: string): boolean {
  // Bio should be less than 200 characters and not contain HTML tags
  return bio.length <= 200 && !/<[^>]*>/g.test(bio);
}

export function isValidSocialLink(link: string): boolean {
  if (!link) return true; // Allow empty links
  return isValidUrl(link);
}

export function isValidProfileImage(imageUrl: string): boolean {
  if (!imageUrl) return true; // Allow empty image URL
  if (!isValidUrl(imageUrl)) return false;
  
  // Additional validation for image URLs
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const urlLower = imageUrl.toLowerCase();
  
  // Check if URL ends with image extension or contains image service patterns
  const hasValidExtension = imageExtensions.some(ext => urlLower.endsWith(ext));
  const hasImagePattern = /(\.(jpg|jpeg|png|gif|webp|bmp)|imgur\.com|cloudinary\.com|images\.)/i.test(urlLower);
  
  return hasValidExtension || hasImagePattern;
}

export function validateUserProfile(profile: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (profile.fullName && !isValidName(profile.fullName)) {
    errors.push('Full name must contain only letters, spaces, hyphens, and apostrophes, and be between 2-50 characters');
  }
  
  if (profile.bio && !isValidBio(profile.bio)) {
    errors.push('Bio must be less than 200 characters and not contain HTML tags');
  }
  
  if (profile.profileImage && !isValidProfileImage(profile.profileImage)) {
    errors.push('Profile image URL must be a valid image URL');
  }
  
  if (profile.socialLinks) {
    const socialPlatforms = ['linkedin', 'twitter', 'instagram', 'youtube', 'other'];
    for (const platform of socialPlatforms) {
      if (profile.socialLinks[platform] && !isValidSocialLink(profile.socialLinks[platform])) {
        errors.push(`${platform} URL must be a valid URL`);
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function isValidPassword(password: string): boolean {
  // Password must be at least 6 characters long and contain at least one letter and one number
  const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/;
  return passwordRegex.test(password);
}

export function isValidFullName(fullName: string): boolean {
  // Full name should have at least a first and last name (with at least 2 characters each)
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  
  // Must have at least 2 parts (first and last name) and each part must be at least 2 characters
  if (parts.length < 2) return false;
  
  for (const part of parts) {
    if (part.length < 2) return false;
  }
  
  // Check if it's a valid name format
  return isValidName(trimmed);
}

export function sanitizeProfileData(profile: any): any {
  const sanitized: any = {};
  
  if (profile.fullName) {
    sanitized.fullName = sanitizeInput(profile.fullName);
  }
  
  if (profile.bio) {
    sanitized.bio = sanitizeInput(profile.bio);
  }
  
  if (profile.profileImage) {
    sanitized.profileImage = profile.profileImage;
  }
  
  if (profile.socialLinks) {
    sanitized.socialLinks = {};
    const platforms = ['linkedin', 'twitter', 'instagram', 'youtube', 'other'];
    
    for (const platform of platforms) {
      if (profile.socialLinks[platform]) {
        sanitized.socialLinks[platform] = profile.socialLinks[platform];
      }
    }
  }
  
  return sanitized;
}

export function validateAndSanitizeProfile(profile: any): { isValid: boolean; sanitizedData: any; errors: string[] } {
  const validation = validateUserProfile(profile);
  
  if (!validation.isValid) {
    return {
      isValid: false,
      sanitizedData: {},
      errors: validation.errors
    };
  }
  
  const sanitizedData = sanitizeProfileData(profile);
  
  return {
    isValid: true,
    sanitizedData,
    errors: []
  };
}

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}