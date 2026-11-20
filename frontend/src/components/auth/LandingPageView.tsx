import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { DrishtikonLogo } from '../common/DrishtikonLogo';
import { getTranslation, type TranslationKey } from '../../data/translations';

export const LandingPageView: React.FC = () => {
  const { loginDoctor, loginAdmin, loginPatient, language, toggleLanguage, showToast } = usePortal();
  const text = (english: string, hindi: string, tamil: string) =>
    language === 'ta' ? tamil : language === 'hi' ? hindi : english;
  const t = (key: TranslationKey) => getTranslation(key, language);

  const [activeTab, setActiveTab] = useState<'admin' | 'doctor' | 'patient'>('doctor');

  // Admin credentials
  const [adminEmail, setAdminEmail] = useState('admin@drishticare.health');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Doctor credentials
  const [doctorId, setDoctorId] = useState('');
  const [doctorPassword, setDoctorPassword] = useState('');
  const [showDoctorPassword, setShowDoctorPassword] = useState(false);

  // Patient credentials
  const [patientIdentifier, setPatientIdentifier] = useState('');

  // Registration form
  const [showRegistration, setShowRegistration] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    full_name: '',
    email: '',
    mobile_number: '',
    qualification: '',
    medical_registration_number: '',
    medical_council: 'National Medical Commission',
    hospital_name: '',
    hospital_address: '',
    password: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!adminEmail.trim() || !adminPassword.trim()) {
      setErrorMessage(t('enterAdminCredentials'));
      return;
    }

    setIsLoading(true);
    try {
      await loginAdmin(adminEmail.trim(), adminPassword.trim());
      showToast('Welcome to the Admin Portal');
    } catch (err: any) {
      setErrorMessage(err?.message || t('adminLoginFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!doctorId.trim()) {
      setErrorMessage(text('Please enter your Doctor ID.', 'कृपया डॉक्टर आईडी दर्ज करें।', 'மருத்துவர் அடையாள எண்ணை உள்ளிடவும்.'));
      return;
    }
    if (!doctorPassword.trim()) {
      setErrorMessage(text('Please enter your password.', 'कृपया पासवर्ड दर्ज करें।', 'கடவுச்சொல்லை உள்ளிடவும்.'));
      return;
    }

    setIsLoading(true);
    try {
      await loginDoctor(doctorId.trim(), doctorPassword.trim());
      showToast(text('Welcome to Clinician Dashboard', 'डॉक्टर पोर्टल में आपका स्वागत है', 'மருத்துவர் முகப்பிற்கு வரவேற்கிறோம்'));
    } catch (err: any) {
      const message = (err?.message || '').toLowerCase();
      if (message.includes('rejected')) setErrorMessage(t('rejectedLoginMessage'));
      else if (message.includes('awaiting') || message.includes('pending')) setErrorMessage(t('pendingLoginMessage'));
      else if (message.includes('suspended')) setErrorMessage(t('suspendedLoginMessage'));
      else if (message.includes('incomplete')) setErrorMessage(t('incompleteLoginMessage'));
      else setErrorMessage(err?.message || text('Doctor login failed.', 'डॉक्टर लॉगिन विफल हुआ।', 'மருத்துவர் உள்நுழைவு தோல்வியடைந்தது.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoctorRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const required = Object.values(registrationForm).every((v) => !!String(v).trim());
    if (!required) {
      setErrorMessage(t('completeRegistration'));
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...registrationForm,
        full_name: registrationForm.full_name.trim(),
        email: registrationForm.email.trim(),
        mobile_number: registrationForm.mobile_number.trim(),
        qualification: registrationForm.qualification.trim(),
        medical_registration_number: registrationForm.medical_registration_number.trim(),
        medical_council: registrationForm.medical_council.trim(),
        hospital_name: registrationForm.hospital_name.trim(),
        hospital_address: registrationForm.hospital_address.trim(),
        password: registrationForm.password.trim(),
      };
      const result = await fetch('/api/v1/doctors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.detail || 'Doctor registration failed.');
        return data;
      });
      showToast(t('registrationSubmitted').replace('{doctorId}', result.doctor_id));
      setShowRegistration(false);
      setRegistrationForm({
        full_name: '',
        email: '',
        mobile_number: '',
        qualification: '',
        medical_registration_number: '',
        medical_council: 'National Medical Commission',
        hospital_name: '',
        hospital_address: '',
        password: '',
      });
      setActiveTab('doctor');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Doctor registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!patientIdentifier.trim()) {
      setErrorMessage(
        text('Please enter your Patient ID or registered phone number.', 'कृपया अपनी मरीज आईडी या पंजीकृत फोन नंबर दर्ज करें।', 'நோயாளர் அடையாள எண் அல்லது பதிவு செய்த கைபேசி எண்ணை உள்ளிடவும்.')
      );
      return;
    }

    setIsLoading(true);
    try {
      await loginPatient(patientIdentifier.trim());
      showToast(text('Welcome to Patient Portal', 'मरीज पोर्टल में आपका स्वागत है', 'நோயாளர் பகுதிக்கு வரவேற்கிறோம்'));
    } catch (err: any) {
      const msg = err?.message || 'Login failed. Please check your Patient ID or Phone Number.';
      if (language === 'ta') {
        if (msg.toLowerCase().includes('no patient record') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('patient login failed') || msg.toLowerCase().includes('phone number does not match')) {
          setErrorMessage('இந்த நோயாளர் எண் அல்லது கைபேசி எண்ணுக்கான பதிவு கிடைக்கவில்லை.');
        } else if (msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('network')) {
          setErrorMessage('சேவையகத்தை அணுக முடியவில்லை. உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்.');
        } else {
          setErrorMessage(msg);
        }
      } else if (language === 'hi') {
        if (msg.toLowerCase().includes('no patient record') || msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('patient login failed') || msg.toLowerCase().includes('phone number does not match')) {
          setErrorMessage('इस मरीज आईडी या फोन नंबर से कोई मरीज रिकॉर्ड नहीं मिला।');
        } else if (msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('network')) {
          setErrorMessage('सर्वर से कनेक्ट करने में असमर्थ। कृपया अपना नेटवर्क जांचें।');
        } else {
          setErrorMessage(msg);
        }
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-between items-center p-4 sm:p-6 md:p-8 antialiased">
      {/* Top Bar with Language Switcher */}
      <header className="w-full max-w-5xl flex justify-between items-center py-2">
        <div className="flex items-center gap-3">
          <DrishtikonLogo size={36} />
        </div>
        <button
          onClick={toggleLanguage}
          aria-label={`${t('changeLanguage')}: English, Hindi, Tamil`}
          className="flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container-high px-3 py-1.5 rounded-full transition-colors text-primary border border-outline-variant/30 text-xs font-semibold"
        >
          <span className="material-symbols-outlined text-[18px]">language</span>
          <span>{language === 'en' ? 'EN' : language === 'hi' ? 'हिन्दी' : 'தமிழ்'}</span>
        </button>
      </header>

      {/* Main Login Card Container */}
      <div className="w-full max-w-md my-auto py-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-primary tracking-tight">
            {text('DrishtiCare Health Portal', 'DrishtiCare स्वास्थ्य पोर्टल', 'DrishtiCare சுகாதாரப் பகுதி')}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            {text('AI-assisted Diabetic Retinopathy Screening & Patient Reports', 'एआई-संचालित डायबिटिक रेटिनोपैथी स्क्रीनिंग एवं मरीज पोर्टल', 'நீரிழிவு விழித்திரை பரிசோதனை மற்றும் நோயாளர் அறிக்கைகள்')}
          </p>
        </div>

        {/* Tab Selection */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-xl border border-surface-container overflow-hidden">
          <div className="grid grid-cols-3 p-1.5 bg-surface-container-low border-b border-surface-container">
            <button
              type="button"
              onClick={() => { setActiveTab('admin'); setErrorMessage(null); }}
              className={`py-2.5 px-4 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === 'admin' ? 'bg-primary-container text-white shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
              <span>{t('adminTab')}</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('doctor'); setErrorMessage(null); }}
              className={`py-2.5 px-4 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === 'doctor' ? 'bg-primary-container text-white shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[16px]">stethoscope</span>
              <span>{t('doctorTab')}</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('patient'); setErrorMessage(null); }}
              className={`py-2.5 px-4 rounded-xl text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-all ${activeTab === 'patient' ? 'bg-primary-container text-white shadow-sm' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container'}`}
            >
              <span className="material-symbols-outlined text-[16px]">person</span>
              <span>{t('patientTab')}</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 sm:p-8">
            {errorMessage && (
              <div className="mb-5 p-3 rounded-xl bg-error-container/40 border border-error/30 text-error text-xs flex items-start gap-2 animate-fade-in">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                <span className="font-medium leading-relaxed">{errorMessage}</span>
              </div>
            )}

            {activeTab === 'admin' ? (
              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label htmlFor="admin-email" className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">{t('adminEmailLabel')}</label>
                  <input id="admin-email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-secondary-fixed bg-surface text-on-surface outline-none focus:border-primary font-medium text-sm" />
                </div>
                <div>
                  <label htmlFor="admin-password" className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5">{t('adminPasswordLabel')}</label>
                  <div className="relative">
                    <input id="admin-password" type={showAdminPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-secondary-fixed bg-surface text-on-surface outline-none focus:border-primary font-medium text-sm" />
                    <button type="button" onClick={() => setShowAdminPassword(!showAdminPassword)} className="absolute right-3 top-2.5 text-on-surface-variant">
                      <span className="material-symbols-outlined text-[20px]">{showAdminPassword ? 'visibility_off' : 'visibility'}</span>
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={isLoading} className="w-full h-11 mt-2 rounded-xl bg-primary-container text-white font-bold text-sm hover:bg-primary transition-all duration-150 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50">
                  {isLoading ? t('signingIn') : t('accessAdminPortal')}
                </button>
              </form>
            ) : activeTab === 'doctor' ? (
              <div className="space-y-4">
                <form onSubmit={handleDoctorSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="doctor-id"
                    className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5"
                  >
                    {text('Doctor ID', 'डॉक्टर आईडी', 'மருத்துவர் அடையாள எண்')}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                      badge
                    </span>
                    <input
                      id="doctor-id"
                      type="text"
                      autoComplete="username"
                      required
                      value={doctorId}
                      onChange={(e) => setDoctorId(e.target.value)}
                      placeholder="e.g. DOC-ANITA"
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-secondary-fixed bg-surface text-on-surface outline-none focus:border-primary font-medium text-sm transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="current-password"
                    className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5"
                  >
                    {text('Password (Date of Birth DDMMYYYY)', 'पासवर्ड (जन्मतिथि DDMMYYYY)', 'கடவுச்சொல் (பிறந்த தேதி DDMMYYYY)')}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                      lock
                    </span>
                    <input
                      id="current-password"
                      type={showDoctorPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={doctorPassword}
                      onChange={(e) => setDoctorPassword(e.target.value)}
                      placeholder="DDMMYYYY (e.g. 15081980)"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-secondary-fixed bg-surface text-on-surface outline-none focus:border-primary font-medium text-sm transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDoctorPassword(!showDoctorPassword)}
                      className="absolute right-3 top-2.5 text-on-surface-variant hover:text-primary transition-colors"
                      title={showDoctorPassword ? 'Hide password' : 'Show password'}
                    >
                      <span className="material-symbols-outlined text-[20px]">
                        {showDoctorPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5 leading-tight">
                    {text('Password is your date of birth formatted as DDMMYYYY.', 'पासवर्ड आपकी जन्मतिथि (DDMMYYYY प्रारूप) है।', 'உங்கள் பிறந்த தேதியை DDMMYYYY வடிவில் கடவுச்சொல்லாக உள்ளிடவும்.')}
                  </p>
                </div>


                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-2 rounded-xl bg-primary-container text-white font-bold text-sm hover:bg-primary transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  ) : (
                    <>
                      <span>{text('Sign In as Clinician', 'डॉक्टर पोर्टल में प्रवेश करें', 'மருத்துவர் பகுதிக்குச் செல்லவும்')}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => setShowRegistration(true)}
                  className="text-primary text-xs font-semibold underline"
                >
                  {t('registerNewDoctor')}
                </button>
              </div>

              {showRegistration && (
                <form onSubmit={handleDoctorRegistration} className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h3 className="text-sm font-bold text-slate-800">{t('doctorRegistration')}</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input value={registrationForm.full_name} onChange={(e) => setRegistrationForm({ ...registrationForm, full_name: e.target.value })} placeholder={t('fullName')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
                    <input value={registrationForm.email} onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })} placeholder={t('email')} type="email" className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
                    <input value={registrationForm.mobile_number} onChange={(e) => setRegistrationForm({ ...registrationForm, mobile_number: e.target.value })} placeholder={t('mobileNumber')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
                    <input value={registrationForm.qualification} onChange={(e) => setRegistrationForm({ ...registrationForm, qualification: e.target.value })} placeholder={t('qualification')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
                    <input value={registrationForm.medical_registration_number} onChange={(e) => setRegistrationForm({ ...registrationForm, medical_registration_number: e.target.value })} placeholder={t('medicalRegistrationNumber')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
                    <input value={registrationForm.medical_council} onChange={(e) => setRegistrationForm({ ...registrationForm, medical_council: e.target.value })} placeholder={t('medicalCouncil')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm" />
                    <input value={registrationForm.hospital_name} onChange={(e) => setRegistrationForm({ ...registrationForm, hospital_name: e.target.value })} placeholder={t('hospitalName')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm md:col-span-2" />
                    <input value={registrationForm.hospital_address} onChange={(e) => setRegistrationForm({ ...registrationForm, hospital_address: e.target.value })} placeholder={t('hospitalAddress')} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm md:col-span-2" />
                    <input value={registrationForm.password} onChange={(e) => setRegistrationForm({ ...registrationForm, password: e.target.value })} placeholder={t('createPassword')} type="password" className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm md:col-span-2" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-semibold text-white">{t('submitForVerification')}</button>
                    <button type="button" onClick={() => setShowRegistration(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Cancel</button>
                  </div>
                </form>
              )}
              </div>
            ) : (
              /* Patient Login Form */
              <form onSubmit={handlePatientSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="patient-identifier"
                    className="block text-xs font-bold text-primary uppercase tracking-wider mb-1.5"
                  >
                    {text('Patient ID or Phone Number', 'मरीज आईडी या पंजीकृत फोन नंबर', 'நோயாளர் அடையாள எண் அல்லது கைபேசி எண்')}
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[20px]">
                      badge
                    </span>
                    <input
                      id="patient-identifier"
                      type="text"
                      autoComplete="username"
                      required
                      value={patientIdentifier}
                      onChange={(e) => setPatientIdentifier(e.target.value)}
                      placeholder={text('e.g. PT-8924 or 98765 43210', 'उदा. PT-8924 या 98765 43210', 'எ.கா. PT-8924 அல்லது 98765 43210')}
                      className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-secondary-fixed bg-surface text-on-surface outline-none focus:border-primary font-medium text-sm transition-colors"
                    />
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5 leading-tight">
                    {text('Enter your Patient ID or registered mobile number. No password required.', 'अपनी मरीज आईडी या पंजीकृत मोबाइल नंबर दर्ज करें। पासवर्ड की आवश्यकता नहीं है।', 'உங்கள் நோயாளர் அடையாள எண் அல்லது பதிவு செய்த கைபேசி எண்ணை உள்ளிடவும். கடவுச்சொல் தேவையில்லை.')}
                  </p>
                </div>

                {/* Demo Patient credentials quick pick */}
                <div className="pt-1 pb-1">
                  <span className="text-[11px] text-on-surface-variant font-semibold block mb-1.5">
                    {text('Demo Patient Account:', 'डेमो मरीज खाता:', 'மாதிரி நோயாளர் கணக்கு:')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientIdentifier('PT-8924');
                    }}
                    className="text-[11px] font-semibold bg-surface-container hover:bg-secondary-fixed text-primary px-2.5 py-1 rounded-lg border border-outline-variant/30 transition-colors"
                  >
                    {language === 'ta' ? 'நரேஷ் குமார் (PT-8924 / 98765 43210)' : 'Naresh Kumar (PT-8924 / 98765 43210)'}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 mt-2 rounded-xl bg-primary-container text-white font-bold text-sm hover:bg-primary transition-all duration-150 flex items-center justify-center gap-2 shadow-sm active:scale-98 disabled:opacity-50"
                >
                  {isLoading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
                  ) : (
                    <>
                      <span>{text('View My Reports', 'अपनी रिपोर्ट देखें', 'எனது அறிக்கைகளைப் பார்க்கவும்')}</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-on-surface-variant mt-6 opacity-75">
          DrishtiCare Rural Retinal AI Screening System · MoHFW Tele-Ophthalmology Initiative
        </p>
      </div>

      <footer className="w-full max-w-5xl text-center py-2 text-[11px] text-on-surface-variant">
        Protected Health Information (PHI) encrypted & HIPAA/DISHA compliant
      </footer>
    </div>
  );
};
