import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  localityService, 
  scrapRateService, 
  pickupService, 
  profileService, 
  adminService,
  notificationService,
  type CreatePickupPayload,
  type UpdateProfilePayload,
} from '@/services';

// ==================== QUERY KEYS ====================
export const queryKeys = {
  localities: ['localities'] as const,
  localitiesByPincode: (pincode: string) => ['localities', 'pincode', pincode] as const,
  scrapRates: (localityId: number) => ['scrapRates', localityId] as const,
  myPickups: ['pickups', 'my'] as const,
  kabadiPickups: (date?: string) => ['pickups', 'kabadi', date] as const,
  earnings: (startDate?: string, endDate?: string) => ['earnings', startDate, endDate] as const,
  pendingPickups: ['pickups', 'pending'] as const,
  availableKabadiwalas: (localityId?: number) => ['kabadiwalas', 'available', localityId] as const,
  citizenProfile: ['profile', 'citizen'] as const,
  kabadiProfile: ['profile', 'kabadi'] as const,
  analytics: ['admin', 'analytics'] as const,
  complaints: (status?: string) => ['admin', 'complaints', status] as const,
  garbageSchedules: (localityId?: number) => ['admin', 'schedules', localityId] as const,
  notifications: ['notifications'] as const,
  unreadCount: ['notifications', 'unread'] as const,
};

// ==================== LOCALITY HOOKS ====================
export function useLocalities() {
  return useQuery({
    queryKey: queryKeys.localities,
    queryFn: () => localityService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useLocalitiesByPincode(pincode: string) {
  return useQuery({
    queryKey: queryKeys.localitiesByPincode(pincode),
    queryFn: () => localityService.getByPincode(pincode),
    enabled: pincode.length === 6,
  });
}

// ==================== SCRAP RATE HOOKS ====================
export function useScrapRates(localityId: number) {
  return useQuery({
    queryKey: queryKeys.scrapRates(localityId),
    queryFn: () => scrapRateService.getByLocality(localityId),
    enabled: !!localityId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateScrapRate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: scrapRateService.updateRate,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.scrapRates(variables.localityId) });
    },
  });
}

// ==================== PICKUP HOOKS (Citizen) ====================
export function useMyPickups() {
  return useQuery({
    queryKey: queryKeys.myPickups,
    queryFn: () => pickupService.getMyPickups(),
  });
}

export function useCreatePickup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreatePickupPayload) => pickupService.createPickup(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myPickups });
    },
  });
}

// ==================== PICKUP HOOKS (Kabadiwala) ====================
export function useKabadiPickups(date?: string) {
  return useQuery({
    queryKey: queryKeys.kabadiPickups(date),
    queryFn: () => pickupService.getKabadiPickups(date),
  });
}

export function useCompletePickup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ assignmentId, actualWeight }: { assignmentId: number; actualWeight: number }) =>
      pickupService.completePickup(assignmentId, actualWeight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickups'] });
      queryClient.invalidateQueries({ queryKey: ['earnings'] });
    },
  });
}

export function useEarnings(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.earnings(startDate, endDate),
    queryFn: () => pickupService.getEarnings(startDate, endDate),
  });
}

// ==================== PROFILE HOOKS ====================
export function useCitizenProfile() {
  return useQuery({
    queryKey: queryKeys.citizenProfile,
    queryFn: () => profileService.getCitizenProfile(),
  });
}

export function useUpdateCitizenProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => profileService.updateCitizenProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.citizenProfile });
    },
  });
}

export function useKabadiProfile() {
  return useQuery({
    queryKey: queryKeys.kabadiProfile,
    queryFn: () => profileService.getKabadiProfile(),
  });
}

// ==================== ADMIN HOOKS ====================
export function usePendingPickups() {
  return useQuery({
    queryKey: queryKeys.pendingPickups,
    queryFn: () => pickupService.getPendingPickups(),
  });
}

export function useAvailableKabadiwalas(localityId?: number) {
  return useQuery({
    queryKey: queryKeys.availableKabadiwalas(localityId),
    queryFn: () => pickupService.getAvailableKabadiwalas(localityId),
  });
}

export function useAssignPickup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ requestId, kabadiwalId, assignedDate, sequenceOrder }: {
      requestId: number;
      kabadiwalId: number;
      assignedDate: string;
      sequenceOrder?: number;
    }) => pickupService.assignPickup(requestId, kabadiwalId, assignedDate, sequenceOrder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingPickups });
    },
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: queryKeys.analytics,
    queryFn: () => adminService.getAnalytics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useComplaints(status?: string) {
  return useQuery({
    queryKey: queryKeys.complaints(status),
    queryFn: () => adminService.getComplaints(status),
  });
}

export function useGarbageSchedules(localityId?: number) {
  return useQuery({
    queryKey: queryKeys.garbageSchedules(localityId),
    queryFn: () => adminService.getGarbageSchedules(localityId),
  });
}

// ==================== NOTIFICATION HOOKS ====================
export function useNotifications() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => notificationService.getNotifications(),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadCount,
    queryFn: () => notificationService.getUnreadCount(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadCount });
    },
  });
}
