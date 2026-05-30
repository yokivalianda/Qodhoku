export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    alert('Browser ini tidak mendukung notifikasi desktop.');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  
  return false;
};

export const getNotificationSettings = () => {
  const raw = localStorage.getItem('qodhoku_notifications');
  if (raw) return JSON.parse(raw);
  return { enabled: false, time: '20:00' };
};

export const setNotificationSettings = (enabled, time) => {
  localStorage.setItem('qodhoku_notifications', JSON.stringify({ enabled, time }));
};

export const sendReminderNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('Waktunya Sholat Qodho! 🕌', {
      body: 'Yuk, sempatkan melunasi hutang sholatmu hari ini agar target harianmu tercapai.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      tag: 'qodho-reminder',
    });
  }
};
