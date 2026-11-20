import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { DrishtikonLogo } from './DrishtikonLogo';
import { DOCTOR_PROFILE, PATIENT_PROFILE } from '../../data/mockData';
import { getTranslation } from '../../data/translations';

interface TopAppBarProps {
  onToggleMobileSidebar?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ onToggleMobileSidebar }) => {
  const { portal, language, toggleLanguage, showToast, currentUser, logout } = usePortal();
  const t = (key: Parameters<typeof getTranslation>[0]) => getTranslation(key, language);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = () => {
    setIsSyncing(true);
    showToast(language === 'hi' ? 'डेटा सिंक्रनाइज़ हो रहा है...' : language === 'ta' ? 'மருத்துவ பதிவுகள் கிளவுடில் ஒத்திசைக்கப்படுகின்றன...' : 'Syncing medical records with cloud database...');
    setTimeout(() => {
      setIsSyncing(false);
      showToast(language === 'hi' ? 'सिंक पूरा हुआ - सभी रिकॉर्ड अपडेट हैं' : language === 'ta' ? 'ஒத்திசைவு முடிந்தது - அனைத்து பதிவுகளும் புதுப்பிக்கப்பட்டுள்ளன.' : 'Sync completed. All screening records updated.');
    }, 1200);
  };

  const currentAvatar = portal === 'doctor' ? DOCTOR_PROFILE.avatar : PATIENT_PROFILE.avatar;
  const currentAvatarAlt = portal === 'doctor' ? 'Clinician Dr. Anita profile' : 'Patient Naresh Kumar profile';

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-surface/95 backdrop-blur-md shadow-sm border-b border-surface-container flex justify-between items-center px-container-margin md:px-stack-lg h-touch-target-min">
      {/* Brand & Mobile Menu Button */}
      <div className="flex items-center gap-3 sm:gap-4">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 -ml-2 rounded-full text-primary hover:bg-surface-container-high transition-colors flex items-center justify-center"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
        )}
        <DrishtikonLogo size={32} />
      </div>

      {/* Center / Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Active Portal Badge & Status */}
        <div className="flex items-center bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/40 shadow-inner">
          <span className="flex items-center gap-1.5 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-[16px] text-primary">
              {portal === 'doctor' ? 'stethoscope' : portal === 'admin' ? 'admin_panel_settings' : 'person'}
            </span>
            <span className="hidden sm:inline">
              {portal === 'doctor' ? `${t('clinicianLabel')}: ${currentUser?.doctor?.doctorId || 'DOC-ANITA'}` : portal === 'admin' ? t('adminPortal') : `${t('patientLabel')}: ${currentUser?.patient?.patientId || 'PT-8924'}`}
            </span>
            <span className="sm:hidden">
              {portal === 'doctor' ? t('doctorPortal') : portal === 'admin' ? t('adminPortal') : t('patientPortal')}
            </span>
          </span>
        </div>

        {/* Language Selector */}
        <button
          onClick={toggleLanguage}
          aria-label={`${t('changeLanguage')}: English, Hindi, Tamil`}
          title={`${t('changeLanguage')}: English, Hindi, Tamil`}
          className="flex items-center gap-1 bg-surface-container-low hover:bg-surface-container-high px-2.5 sm:px-3 py-1.5 rounded-full transition-colors text-primary border border-outline-variant/30 text-label-sm font-label-md"
        >
          <span className="material-symbols-outlined text-[18px]">language</span>
          <span className="text-xs font-semibold">
            {language === 'en' ? 'EN' : language === 'hi' ? 'हिन्दी' : 'தமிழ்'}
          </span>
        </button>

        {/* Sync Button / Indicator */}
        <button
          onClick={handleSync}
          disabled={isSyncing}
          aria-label="Sync status"
          className="flex items-center gap-1.5 text-on-surface-variant hover:bg-surface-container-high p-2 sm:px-3 sm:py-1.5 rounded-full transition-colors active:opacity-80"
          title="Cloud Sync Status"
        >
          <span className={`material-symbols-outlined text-[18px] text-primary ${isSyncing ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span className="font-label-sm text-label-sm text-primary hidden md:inline">
            {isSyncing ? t('syncing') : t('synced')}
          </span>
        </button>

        {/* Logout Button */}
        <button
          onClick={logout}
          aria-label="Sign out of portal"
          title="Sign out"
          className="flex items-center gap-1.5 bg-surface-container-low hover:bg-error-container/50 hover:text-error px-2.5 sm:px-3.5 py-1.5 rounded-full transition-colors text-on-surface-variant hover:border-error/40 border border-outline-variant/30 text-xs font-semibold cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[17px] text-error">logout</span>
          <span className="text-xs font-semibold text-error">{t('signOut')}</span>
        </button>

        {/* User Profile Avatar */}
        <div className="ml-1 flex items-center gap-2">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 border-primary-container/40 shadow-sm flex-shrink-0">
            {portal === 'admin' ? (
              <span className="material-symbols-outlined flex h-full w-full items-center justify-center bg-cyan-50 text-primary" aria-label="Administrator profile">admin_panel_settings</span>
            ) : (
              <img src={currentAvatar} alt={currentAvatarAlt} className="h-full w-full object-cover" loading="lazy" />
            )}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-bold text-primary leading-tight">
              {portal === 'doctor' ? (currentUser?.doctor?.name || DOCTOR_PROFILE.name) : portal === 'admin' ? (currentUser?.admin?.name || 'DrishtiCare Admin') : (currentUser?.patient?.name || PATIENT_PROFILE.name)}
            </span>
            <span className="text-[10px] text-on-surface-variant leading-none">
              {portal === 'doctor' ? (currentUser?.doctor?.hospital || DOCTOR_PROFILE.hospital) : portal === 'admin' ? (currentUser?.admin?.email || 'Administrator') : `ID: ${currentUser?.patient?.patientId || 'PT-8924'}`}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
