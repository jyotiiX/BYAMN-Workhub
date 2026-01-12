import { 
  sanitizeInput, 
  isValidName, 
  isValidBio, 
  isValidProfileImage, 
  isValidSocialLink, 
  validateUserProfile, 
  sanitizeProfileData, 
  validateAndSanitizeProfile,
  isValidCampaignTitle,
  isValidCampaignDescription,
  isValidCampaignInstructions,
  isValidCampaignCategory,
  isValidPassword
} from './src/lib/utils';

console.log('Testing enhanced validation functions...\n');

// Test sanitizeInput
console.log('1. Testing sanitizeInput:');
console.log('Normal input:', sanitizeInput('John Doe'));
console.log('With script:', sanitizeInput('<script>alert("xss")</script>John'));
console.log('With javascript:', sanitizeInput('javascript:alert("xss")'));
console.log('With data:', sanitizeInput('data:text/html,<script>alert(1)</script>'));

// Test isValidName
console.log('\n2. Testing isValidName:');
console.log('Valid name "John Doe":', isValidName('John Doe'));
console.log('Invalid name with numbers "John123":', isValidName('John123'));
console.log('Invalid name with HTML "John<script>":', isValidName('John<script>'));

// Test isValidBio
console.log('\n3. Testing isValidBio:');
console.log('Valid bio:', isValidBio('This is a short bio'));
console.log('With HTML:', isValidBio('This is a bio with <script> tag'));
console.log('Too long:', isValidBio('a'.repeat(201)));

// Test isValidProfileImage
console.log('\n4. Testing isValidProfileImage:');
console.log('Valid image URL:', isValidProfileImage('https://example.com/image.jpg'));
console.log('Invalid URL:', isValidProfileImage('javascript:alert(1)'));
console.log('Non-image URL:', isValidProfileImage('https://example.com/document.pdf'));

// Test isValidSocialLink
console.log('\n5. Testing isValidSocialLink:');
console.log('Valid URL:', isValidSocialLink('https://linkedin.com/in/johndoe'));
console.log('Invalid protocol:', isValidSocialLink('javascript:alert(1)'));

// Test isValidCampaignTitle
console.log('\n6. Testing isValidCampaignTitle:');
console.log('Valid title:', isValidCampaignTitle('Great Campaign'));
console.log('Too short:', isValidCampaignTitle('Hi'));
console.log('With script:', isValidCampaignTitle('Campaign <script>alert(1)</script>'));

// Test isValidCampaignDescription
console.log('\n7. Testing isValidCampaignDescription:');
console.log('Valid description:', isValidCampaignDescription('This is a good description for a campaign.'));
console.log('Too short:', isValidCampaignDescription('Short'));
console.log('With script:', isValidCampaignDescription('Description with <script>alert(1)</script>'));

// Test isValidCampaignInstructions
console.log('\n8. Testing isValidCampaignInstructions:');
console.log('Valid instructions:', isValidCampaignInstructions('Do this and that for the campaign.'));
console.log('Too short:', isValidCampaignInstructions('Do it.'));
console.log('With script:', isValidCampaignInstructions('Instructions with <script>alert(1)</script>'));

// Test isValidCampaignCategory
console.log('\n9. Testing isValidCampaignCategory:');
console.log('Valid category:', isValidCampaignCategory('Social Media'));
console.log('Invalid category:', isValidCampaignCategory('Hacking'));

// Test isValidPassword
console.log('\n10. Testing isValidPassword:');
console.log('Valid password:', isValidPassword('MyPass123!'));
console.log('Too short:', isValidPassword('weak'));
console.log('No uppercase:', isValidPassword('mypas123!'));
console.log('No number:', isValidPassword('MyPass!'));
console.log('No special char:', isValidPassword('MyPass123'));

// Test profile validation
console.log('\n11. Testing profile validation:');
const testProfile = {
  fullName: 'John Doe',
  bio: 'Software developer',
  profileImage: 'https://example.com/image.jpg',
  socialLinks: {
    linkedin: 'https://linkedin.com/in/johndoe',
    twitter: 'https://twitter.com/johndoe'
  }
};

const validation = validateUserProfile(testProfile);
console.log('Valid profile validation:', validation.isValid);

const maliciousProfile = {
  fullName: '<script>alert("xss")</script>',
  bio: 'Normal bio',
  socialLinks: {
    linkedin: 'javascript:alert(1)'
  }
};

const maliciousValidation = validateUserProfile(maliciousProfile);
console.log('Malicious profile validation (should be invalid):', maliciousValidation.isValid);
console.log('Validation errors:', maliciousValidation.errors);

// Test profile sanitization
console.log('\n12. Testing profile sanitization:');
const sanitized = sanitizeProfileData(maliciousProfile);
console.log('Sanitized profile:', sanitized);

console.log('\nAll tests completed!');