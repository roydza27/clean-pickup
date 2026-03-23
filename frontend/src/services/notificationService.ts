import api from '@/lib/api';

export interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  notification_type: 'pickup_assigned' | 'payment_received' | 'garbage_schedule' | 'general';
  is_read: boolean;
  created_at: string;
}

export const notificationService = {
  // Get user notifications
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get('/notifications');
    return response.data.notifications;
  },

  // Mark notification as read
  async markAsRead(notificationId: number): Promise<{ success: boolean }> {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ success: boolean }> {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },
};

export default notificationService;
