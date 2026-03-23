import api from '@/lib/api';

export interface ScrapRate {
  rate_id: number;
  locality_id: number;
  category: 'plastic' | 'paper' | 'metal';
  rate_per_kg: number;
  effective_date: string;
  locality_name?: string;
}

export interface UpdateRatePayload {
  localityId: number;
  category: string;
  ratePerKg: number;
  effectiveDate?: string;
}

export const scrapRateService = {
  // Get current scrap rates for a locality
  async getByLocality(localityId: number): Promise<ScrapRate[]> {
    const response = await api.get(`/scrap-rates/${localityId}`);
    return response.data.rates;
  },

  // Update scrap rate (Admin only)
  async updateRate(payload: UpdateRatePayload): Promise<{ success: boolean; rateId: number }> {
    const response = await api.post('/scrap-rates', payload);
    return response.data;
  },
};

export default scrapRateService;
