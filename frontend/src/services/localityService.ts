import api from '@/lib/api';

export interface Locality {
  locality_id: number;
  name: string;
  pincode: string;
  city: string;
  state: string;
  is_serviceable: boolean;
}

// ✅ standalone named export (for quick use / testing)
export async function fetchLocalities(): Promise<Locality[]> {
  const res = await api.get('/localities');
  return res.data.localities;
}

// ✅ service object (for long-term scalable usage)
export const localityService = {
  // Get all serviceable localities
  async getAll(): Promise<Locality[]> {
    const response = await api.get('/localities');
    return response.data.localities;
  },

  // Get localities by pincode
  async getByPincode(pincode: string): Promise<Locality[]> {
    const response = await api.get(`/localities/pincode/${pincode}`);
    return response.data.localities;
  },
};

export default localityService;
