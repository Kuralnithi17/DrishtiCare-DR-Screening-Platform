import React from 'react';
import { usePortal } from '../../context/PortalContext';
import { PATIENT_PROFILE } from '../../data/mockData';

export const PatientProfileView: React.FC = () => {
  const { language, setLanguage, showToast } = usePortal();

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="pt-2">
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary font-bold">
          {language === 'hi' ? 'मरीज प्रोफाइल' : language === 'ta' ? 'நோயாளர் சுயவிவரம்' : 'Patient Profile'}
        </h1>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1 text-sm">
          {language === 'hi'
            ? 'आपकी व्यक्तिगत और स्वास्थ्य रिकॉर्ड जानकारी'
            : language === 'ta' ? 'உங்கள் பதிவு விவரங்கள் மற்றும் சுகாதாரத் தகவல்கள்' : 'Your registered details and health card information'}
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-[0_2px_8px_rgba(7,59,76,0.05)] border border-surface-container flex flex-col sm:flex-row items-center sm:items-start gap-5">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-container/20 shadow-md flex-shrink-0">
          <img
            src={PATIENT_PROFILE.avatar}
            alt="Naresh Kumar"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="text-center sm:text-left flex-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
            <h2 className="font-headline-md text-xl font-bold text-primary">
              {language === 'hi' ? PATIENT_PROFILE.nameHi : PATIENT_PROFILE.name}
            </h2>
            <span className="bg-secondary-container text-primary font-mono text-xs px-2.5 py-0.5 rounded-full font-bold">
              ID: {PATIENT_PROFILE.id}
            </span>
          </div>
          <p className="text-xs text-on-surface-variant mb-4">
            {language === 'ta' ? 'வயது' : 'Age'}: {PATIENT_PROFILE.age} {language === 'ta' ? 'ஆண்டுகள்' : 'Years'} · {language === 'ta' ? 'பாலினம்' : 'Gender'}: {PATIENT_PROFILE.gender} · {language === 'ta' ? 'பிறந்த தேதி' : 'DOB'}: {PATIENT_PROFILE.dob}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-surface-container-low p-3 rounded-lg border border-surface-container">
              <span className="text-on-surface-variant block mb-0.5">{language === 'ta' ? 'கைபேசி எண்:' : 'Phone Number:'}</span>
              <span className="font-bold text-on-surface">{PATIENT_PROFILE.phone}</span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg border border-surface-container">
              <span className="text-on-surface-variant block mb-0.5">{language === 'ta' ? 'ஒதுக்கப்பட்ட ஆரம்ப சுகாதார நிலையம்:' : 'Assigned Primary Health Center:'}</span>
              <span className="font-bold text-on-surface">{PATIENT_PROFILE.location}</span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg border border-surface-container">
              <span className="text-on-surface-variant block mb-0.5">{language === 'ta' ? 'ஆயுஷ்மான் பாரத் (ABHA) எண்:' : 'Ayushman Bharat (ABHA) ID:'}</span>
              <span className="font-bold font-mono text-on-surface">91-4521-8890-1204</span>
            </div>
            <div className="bg-surface-container-low p-3 rounded-lg border border-surface-container">
              <span className="text-on-surface-variant block mb-0.5">{language === 'ta' ? 'பரிசோதனை நிலை:' : 'Screening Status:'}</span>
              <span className="font-bold text-[#2E7D32]">{language === 'ta' ? 'புதுப்பிக்கப்பட்டது (4 முடிந்தது)' : 'Up to Date (4 Completed)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences & Settings */}
      <div className="bg-surface-container-lowest rounded-xl p-stack-lg shadow-[0_2px_8px_rgba(7,59,76,0.05)] border border-surface-container space-y-4">
        <h3 className="font-headline-md text-base font-bold text-primary">
          {language === 'hi' ? 'प्राथमिकताएं और भाषा' : language === 'ta' ? 'விருப்பங்கள் மற்றும் மொழி' : 'Preferences & Language'}
        </h3>

        <div className="flex items-center justify-between py-2 border-b border-surface-container">
          <div>
            <h4 className="text-sm font-bold text-on-surface">
              {language === 'hi' ? 'भाषा' : language === 'ta' ? 'பயன்பாட்டு மொழி' : 'App Language'}
            </h4>
            <p className="text-xs text-on-surface-variant">
              {language === 'ta' ? 'ஆங்கிலம், हिन्दी மற்றும் தமிழில் தேர்வு செய்யவும்' : 'Choose English, हिन्दी, or தமிழ்'}
            </p>
          </div>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as 'en' | 'hi' | 'ta')}
            aria-label="App language"
            className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="ta">தமிழ்</option>
          </select>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-surface-container">
          <div>
            <h4 className="text-sm font-bold text-on-surface">
              {language === 'hi' ? 'एसएमएस सूचनाएं' : language === 'ta' ? 'குறுஞ்செய்தி அறிவிப்புகள்' : 'SMS Notifications'}
            </h4>
            <p className="text-xs text-on-surface-variant">{language === 'ta' ? 'பரிசோதனை அறிக்கைகள் மற்றும் நினைவூட்டல்களை கைபேசியில் பெறவும்' : 'Receive screening reports and reminder alerts on your phone'}</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            onChange={() => showToast('Notification settings updated')}
            className="w-5 h-5 accent-primary cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="text-sm font-bold text-on-surface">
              {language === 'hi' ? 'ऑडियो सारांश' : language === 'ta' ? 'குரல் உதவி' : 'Voice Assistance'}
            </h4>
            <p className="text-xs text-on-surface-variant">{language === 'ta' ? 'மருத்துவ விளக்கங்களை ஒலியாகக் கேட்கவும்' : 'Enable automated text-to-speech for all medical explanations'}</p>
          </div>
          <input
            type="checkbox"
            defaultChecked
            onChange={() => showToast('Voice assistance enabled')}
            className="w-5 h-5 accent-primary cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
