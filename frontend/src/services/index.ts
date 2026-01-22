// Export all services
export { default as authService, type LoginResponse, type OTPResponse } from './authService';
export { default as localityService, type Locality } from './localityService';
export { default as scrapRateService, type ScrapRate, type UpdateRatePayload } from './scrapRateService';
export { default as pickupService, type PickupRequest, type CreatePickupPayload, type KabadiPickup, type EarningsSummary } from './pickupService';
export { default as profileService, type CitizenProfile, type KabadiProfile, type UpdateProfilePayload } from './profileService';
export { default as adminService, type AnalyticsSummary, type LocalityStats, type Complaint, type GarbageSchedule } from './adminService';
export { default as notificationService, type Notification } from './notificationService';
