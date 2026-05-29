import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { IconHome, IconCalendar, IconStats, IconUser, IconPlus } from './Icons';

const NAV_ITEMS = [
  { key: 'home',       Icon: IconHome,     label: 'Beranda' },
  { key: 'calendar',   Icon: IconCalendar, label: 'Riwayat' },
  { key: 'quickAdd',   Icon: null,         label: null },  // FAB slot
  { key: 'statistics', Icon: IconStats,    label: 'Statistik' },
  { key: 'profile',    Icon: IconUser,     label: 'Profil' },
];

const BottomNav = ({ currentScreen }) => {
  const { navigate } = useNavigation();

  return (
    <div className="bottom-nav">
      {NAV_ITEMS.map(item => {
        if (!item.Icon) {
          // FAB button
          return (
            <div key="fab" className="nav-fab" onClick={() => navigate('quickAdd')}>
              <IconPlus size={22} />
            </div>
          );
        }
        const isActive = currentScreen === item.key;
        const { Icon } = item;
        return (
          <div
            key={item.key}
            className={`nav-item ${isActive ? 'active' : 'inactive'}`}
            onClick={() => navigate(item.key)}
          >
            <div className="nav-item-icon-wrap">
              <Icon size={21} />
            </div>
            <span className={`nav-item-label ${isActive ? 'active' : ''}`}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default BottomNav;
