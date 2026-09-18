import { apiRequest } from './client';
import { NotificationItem } from '../../types';

export const notificationService = {
  getNotifications: async (): Promise<{ notifications: NotificationItem[]; unread_count: number }> => {
    return apiRequest<{ notifications: NotificationItem[]; unread_count: number }>('/api/v1/notifications');
  },

  markRead: async (id: string): Promise<any> => {
    return apiRequest(`/api/v1/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllRead: async (): Promise<any> => {
    return apiRequest('/api/v1/notifications/read-all', {
      method: 'PUT',
    });
  },
};
