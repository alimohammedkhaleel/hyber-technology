import React, { useEffect, useState } from 'react';
import { notificationService } from '../../services/api/notificationService';
import { NotificationItem } from '../../types';
import {
  Bell,
  CheckCheck,
  Package,
  Calendar,
  DollarSign,
  Info,
  Clock,
  ExternalLink,
  RefreshCw,
  Inbox
} from 'lucide-react';
import { SEOHead } from '../../components/common/SEO/SEOHead';
import './NotificationsPage.css';

interface NotificationsPageProps {
  onNavigate?: (path: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({ onNavigate }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setActionLoading(true);
      await notificationService.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const getNotificationIcon = (title: string) => {
    if (title.includes('طلب') || title.includes('توصيل') || title.includes('شحن')) {
      return <Package size={20} className="notif-type-icon notif-order" />;
    }
    if (title.includes('حجز') || title.includes('موعد') || title.includes('جلسة')) {
      return <Calendar size={20} className="notif-type-icon notif-booking" />;
    }
    if (title.includes('دفع') || title.includes('فاتورة') || title.includes('مستحقات')) {
      return <DollarSign size={20} className="notif-type-icon notif-payment" />;
    }
    return <Info size={20} className="notif-type-icon notif-general" />;
  };

  const handleNavigate = (item: NotificationItem) => {
    if (!item.is_read) {
      handleMarkAsRead(item.id);
    }
    const meta: any = typeof item.metadata === 'string' ? JSON.parse(item.metadata || '{}') : (item.metadata || {});
    // Note: window.location.hash already prepends '#', so we use paths without '#'
    if (meta?.order_id) {
      window.location.hash = `/orders/${meta.order_id}`;
    } else if (meta?.booking_id || item.type === 'BOOKING') {
      window.location.hash = '/my-bookings';
    } else if (meta?.vendor_id || item.type === 'PARTNER_MODERATION' || item.type === 'PRODUCT_MODERATION') {
      window.location.hash = '/vendor-portal';
    } else if (item.type === 'DELIVERY') {
      if (meta?.order_id) {
        window.location.hash = `/orders/${meta.order_id}`;
      } else {
        window.location.hash = '/driver';
      }
    } else if (item.type === 'ORDER') {
      window.location.hash = '/orders';
    }
  };

  const filteredList = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    return true;
  });

  return (
    <div className="notifications-page-container">
      <SEOHead
        title="مركز الإشعارات"
        description="مركز الإشعارات والتنبيهات لمتابعة حالة الطلبات والأنشطة في متجر هايبر تكنولوجي."
      />
      {/* Header */}
      <header className="notifications-header">
        <div className="notifications-header-info">
          <div className="notif-title-badge">
            <Bell size={24} />
            {unreadCount > 0 && <span className="unread-dot-badge">{unreadCount}</span>}
          </div>
          <div>
            <h1 className="notifications-title">مركز الإشعارات والتنبيهات</h1>
            <p className="notifications-subtitle">
              متابعة مباشرة لجميع تحديثات الطلبات، الحجوزات، وعمليات النظام
            </p>
          </div>
        </div>

        <div className="notifications-header-actions">
          {unreadCount > 0 && (
            <button
              className="mark-all-read-btn"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
            >
              <CheckCheck size={16} />
              تمييز الكل كمقروء
            </button>
          )}
          <button
            className="refresh-notifs-btn"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="notif-filter-bar">
        <button
          className={`notif-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          كافة الإشعارات ({notifications.length})
        </button>
        <button
          className={`notif-filter-btn ${filter === 'UNREAD' ? 'active' : ''}`}
          onClick={() => setFilter('UNREAD')}
        >
          غير المقروءة ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <main className="notifications-list-wrapper">
        {loading && notifications.length === 0 ? (
          <div className="notifs-empty-state">
            <RefreshCw size={32} className="spinning" />
            <p>جاري تحميل الإشعارات...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="notifs-empty-state">
            <Inbox size={48} />
            <h3>لا توجد إشعارات في هذا القسم</h3>
            <p>أي تحديثات جديدة تخص طلباتك أو نشاط حسابك ستظهر هنا فوراً.</p>
          </div>
        ) : (
          <div className="notifs-list">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className={`notif-card ${!item.is_read ? 'unread' : 'read'}`}
                onClick={() => handleNavigate(item)}
              >
                <div className="notif-icon-col">{getNotificationIcon(item.title)}</div>
                <div className="notif-content-col">
                  <div className="notif-head">
                    <h3 className="notif-item-title">{item.title}</h3>
                    <span className="notif-time">
                      <Clock size={12} />
                      {new Date(item.created_at).toLocaleString('ar-EG', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="notif-item-body">{item.body || item.message}</p>
                  {(item.metadata?.order_id || item.metadata?.booking_id || item.metadata?.vendor_id) && (
                    <div className="notif-action-hint">
                      <span>عرض التفاصيل</span>
                      <ExternalLink size={12} />
                    </div>
                  )}
                </div>
                {!item.is_read && (
                  <div className="notif-unread-indicator" title="غير مقروء"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
