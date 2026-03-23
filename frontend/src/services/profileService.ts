import api from '@/lib/api';

export interface CitizenProfile {
  user_id: number;
  phone_number: string;
  name: string;
  role: string;
  locality_id?: number;
  address_line1?: string;
  address_line2?: string;
  landmark?: string;
  preferred_language: 'english' | 'hindi';
  locality_name?: string;
  pincode?: string;
  city?: string;
}

export interface UpdateProfilePayload {
  name: string;
  localityId?: number;
  addressLine1?: string;
  addressLine2?: string;
  landmark?: string;
  preferredLanguage?: string;
}

export interface KabadiProfile {
  user_id: number;
  name: string;
  phone_number: string;
  trust_score: number;
  total_pickups: number;
  completed_pickups: number;
  is_available: boolean;
  service_locality_name?: string;
  vehicle_type?: string;
}

export const profileService = {
  // ==================== CITIZEN APIs ====================
  
  // Get citizen profile
  async getCitizenProfile(): Promise<CitizenProfile> {
    const response = await api.get('/citizen/profile');
    return response.data.profile;
  },

  // Update citizen profile
  async updateCitizenProfile(payload: UpdateProfilePayload): Promise<{ success: boolean }> {
    const response = await api.put('/citizen/profile', payload);
    return response.data;
  },

  // ==================== KABADIWALA APIs ====================
  
  // Get kabadiwala profile
  async getKabadiProfile(): Promise<KabadiProfile> {
    const response = await api.get('/kabadiwala/profile');
    return response.data.profile;
  },

  // Update availability
  async updateAvailability(isAvailable: boolean): Promise<{ success: boolean }> {
    const response = await api.put('/kabadiwala/availability', { isAvailable });
    return response.data;
  },
};

export default profileService;
