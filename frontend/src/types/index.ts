export type UserRole = 'citizen' | 'kabadiwala' | 'admin';

export interface User {
  id: string;
  phone?: string;
  email?: string;
  name: string;
  role: UserRole;
  locality?: string;
  pincode?: string;
}

export interface ScrapRate {
  id: string;
  category: string;
  nameEn: string;
  nameHi: string;
  rate: number;
  unit: string;
  icon: string;
  updatedAt: string;
}

export interface Pickup {
  id: string;
  citizenId: string;
  citizenName: string;
  citizenPhone: string;
  kabadiWalaId?: string;
  kabadiWalaName?: string;
  categories: string[];
  scheduledDate: string;
  scheduledTime?: string;
  address: string;
  locality: string;
  pincode: string;
  status: 'scheduled' | 'assigned' | 'in-progress' | 'completed' | 'missed' | 'cancelled';
  notes?: string;
  weight?: number;
  amount?: number;
  completedAt?: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  pickupId: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  upiReference?: string;
  paidAt?: string;
}

export interface GarbageTiming {
  id: string;
  locality: string;
  pincode: string;
  day: string;
  startTime: string;
  endTime: string;
  vehicleNumber?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'pickup' | 'payment' | 'general' | 'alert';
  read: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  userId: string;
  userName: string;
  pickupId?: string;
  kabadiWalaId?: string;
  category: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdAt: string;
  resolvedAt?: string;
}

export interface Kabadiwala {
  id: string;
  name: string;
  phone: string;
  localities: string[];
  trustScore: number;
  totalPickups: number;
  todayPickups: number;
  todayEarnings: number;
  status: 'active' | 'inactive' | 'suspended';
}

export interface Locality {
  id: string;
  name: string;
  pincode: string;
  zone: string;
  isActive: boolean;
}

export interface DashboardStats {
  totalPickups: number;
  completedPickups: number;
  pendingPickups: number;
  totalEarnings: number;
  activeKabadiwalas: number;
  landfillDiverted: number;
}
