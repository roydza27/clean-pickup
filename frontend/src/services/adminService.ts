import api from '@/lib/api';

export interface AnalyticsSummary {
  totalPickups: number;
  totalWeightKg: number;
  totalEarnings: number;
  activeKabadiwalas: number;
  pendingRequests: number;
  completedToday: number;
}

export interface LocalityStats {
  locality_name: string;
  category: string;
  total_requests: number;
  completed_requests: number;
  pending_requests: number;
  total_weight_kg: number;
}

export interface Complaint {
  complaint_id: number;
  citizen_id: number;
  citizen_name: string;
  assignment_id?: number;
  complaint_type: 'missed_pickup' | 'delayed_pickup' | 'improper_behavior' | 'other';
  description: string;
  status: 'submitted' | 'under_review' | 'resolved';
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
}

export interface GarbageSchedule {
  schedule_id: number;
  locality_id: number;
  locality_name: string;
  collection_day: string;
  time_window_start: string;
  time_window_end: string;
  is_active: boolean;
}

export const adminService = {
  // Get analytics dashboard data
  async getAnalytics(): Promise<{ summary: AnalyticsSummary; byLocality: LocalityStats[] }> {
    const response = await api.get('/admin/analytics');
    return response.data;
  },

  // Get all complaints
  async getComplaints(status?: string): Promise<Complaint[]> {
    const params = status ? { status } : {};
    const response = await api.get('/admin/complaints', { params });
    return response.data.complaints;
  },

  // Update complaint status
  async updateComplaint(complaintId: number, status: string, resolutionNotes?: string): Promise<{ success: boolean }> {
    const response = await api.put(`/admin/complaints/${complaintId}`, {
      status,
      resolutionNotes,
    });
    return response.data;
  },

  // Get garbage schedules
  async getGarbageSchedules(localityId?: number): Promise<GarbageSchedule[]> {
    const params = localityId ? { localityId } : {};
    const response = await api.get('/admin/garbage-schedules', { params });
    return response.data.schedules;
  },

  // Create/update garbage schedule
  async saveGarbageSchedule(schedule: Partial<GarbageSchedule>): Promise<{ success: boolean }> {
    const response = await api.post('/admin/garbage-schedules', schedule);
    return response.data;
  },

  // Get all localities (for management)
  async getAllLocalities() {
    const response = await api.get('/admin/localities');
    return response.data.localities;
  },

  // Add new locality
  async addLocality(locality: { name: string; pincode: string; city: string; state: string }) {
    const response = await api.post('/admin/localities', locality);
    return response.data;
  },

  // Get all kabadiwalas
  async getAllKabadiwalas() {
    const response = await api.get('/admin/kabadiwalas/all');
    return response.data.kabadiwalas;
  },

  // Update kabadiwala status
  async updateKabadiStatus(userId: number, isActive: boolean) {
    const response = await api.put(`/admin/kabadiwalas/${userId}/status`, { isActive });
    return response.data;
  },
};

export default adminService;
