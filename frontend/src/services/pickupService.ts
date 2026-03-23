import api from '@/lib/api';

export interface PickupRequest {
  request_id: number;
  citizen_id: number;
  locality_id: number;
  category: 'plastic' | 'paper' | 'metal';
  estimated_weight: number;
  pickup_address: string;
  landmark?: string;
  preferred_date: string;
  preferred_time_slot: 'morning' | 'afternoon' | 'evening';
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  notes?: string;
  locality_name?: string;
  assignment_id?: number;
  assignment_status?: string;
  actual_weight?: number;
  kabadiwala_name?: string;
  kabadiwala_phone?: string;
  payment_status?: string;
  payment_amount?: number;
  created_at: string;
}

export interface CreatePickupPayload {
  localityId: number;
  category: string;
  estimatedWeight: number;
  pickupAddress: string;
  landmark?: string;
  preferredDate: string;
  preferredTimeSlot: string;
  notes?: string;
}

export interface KabadiPickup {
  assignment_id: number;
  request_id: number;
  sequence_order: number;
  status: string;
  category: string;
  pickup_address: string;
  landmark?: string;
  citizen_name: string;
  citizen_phone: string;
  locality_name: string;
  rate_per_kg: number;
  estimated_weight: number;
  notes?: string;
}

export interface EarningsSummary {
  earnings: {
    date: string;
    pickups_completed: number;
    total_earnings: number;
    total_weight: number;
  }[];
  summary: {
    totalPickups: number;
    totalEarnings: number;
    totalWeight: number;
  };
}

export const pickupService = {
  // ==================== CITIZEN APIs ====================
  
  // Create a new pickup request
  async createPickup(payload: CreatePickupPayload): Promise<{ success: boolean; requestId: number }> {
    const response = await api.post('/pickups/request', payload);
    return response.data;
  },

  // Get citizen's pickup requests
  async getMyPickups(): Promise<PickupRequest[]> {
    const response = await api.get('/pickups/my-requests');
    return response.data.requests;
  },

  // ==================== KABADIWALA APIs ====================
  
  // Get assigned pickups for a date
  async getKabadiPickups(date?: string): Promise<KabadiPickup[]> {
    const params = date ? { date } : {};
    const response = await api.get('/kabadiwala/pickups', { params });
    return response.data.pickups;
  },

  // Complete a pickup
  async completePickup(assignmentId: number, actualWeight: number): Promise<{ success: boolean }> {
    const response = await api.post('/kabadiwala/complete-pickup', {
      assignmentId,
      actualWeight,
    });
    return response.data;
  },

  // Get kabadiwala earnings
  async getEarnings(startDate?: string, endDate?: string): Promise<EarningsSummary> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get('/kabadiwala/earnings', { params });
    return response.data;
  },

  // ==================== ADMIN APIs ====================
  
  // Get pending pickup requests
  async getPendingPickups(): Promise<PickupRequest[]> {
    const response = await api.get('/admin/pickups/pending');
    return response.data.requests;
  },

  // Get available kabadiwalas
  async getAvailableKabadiwalas(localityId?: number) {
    const params = localityId ? { localityId } : {};
    const response = await api.get('/admin/kabadiwalas', { params });
    return response.data.kabadiwalas;
  },

  // Assign pickup to kabadiwala
  async assignPickup(requestId: number, kabadiwalId: number, assignedDate: string, sequenceOrder?: number) {
    const response = await api.post('/admin/assign-pickup', {
      requestId,
      kabadiwalId,
      assignedDate,
      sequenceOrder: sequenceOrder || 1,
    });
    return response.data;
  },
};

export default pickupService;
