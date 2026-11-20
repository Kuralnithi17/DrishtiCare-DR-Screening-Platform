import React, { useEffect, useMemo, useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { apiService } from '../../services/apiService';
import { getTranslation, type TranslationKey } from '../../data/translations';

type AdminSection = 'overview' | 'verification' | 'doctors' | 'patients' | 'screenings' | 'analytics' | 'audit' | 'health';

const navigation: { id: AdminSection; label: TranslationKey; icon: string }[] = [
  { id: 'overview', label: 'overview', icon: 'space_dashboard' },
  { id: 'verification', label: 'doctorVerification', icon: 'fact_check' },
  { id: 'doctors', label: 'doctorManagement', icon: 'stethoscope' },
  { id: 'patients', label: 'patientManagement', icon: 'group' },
  { id: 'screenings', label: 'screeningMonitoring', icon: 'monitor_heart' },
  { id: 'analytics', label: 'reportsAnalytics', icon: 'bar_chart' },
  { id: 'audit', label: 'auditLogs', icon: 'manage_search' },
  { id: 'health', label: 'systemHealth', icon: 'monitoring' },
];

const statusClass = (status: string) => {
  const value = (status || '').toLowerCase();
  if (['verified', 'healthy', 'available', 'success', 'approved'].includes(value)) return 'bg-emerald-50 text-emerald-700';
  if (['pending', 'review_required', 'incomplete', 'warning'].includes(value)) return 'bg-amber-50 text-amber-700';
  if (['rejected', 'suspended', 'unhealthy', 'error', 'unavailable'].includes(value)) return 'bg-rose-50 text-rose-700';
  return 'bg-slate-100 text-slate-600';
};

const formatDate = (value: string | null | undefined, language: 'en' | 'hi' | 'ta') => value
  ? new Date(value).toLocaleString(language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-US')
  : getTranslation('statusNotAvailable', language);

const localizedStatus = (value: string, language: 'en' | 'hi' | 'ta') => {
  const keys: Record<string, TranslationKey> = {
    verified: 'statusVerified', pending: 'statusPending', rejected: 'statusRejected',
    suspended: 'statusSuspended', incomplete: 'statusIncomplete', healthy: 'statusHealthy',
    ok: 'statusHealthy', available: 'statusAvailable', unhealthy: 'statusUnhealthy',
    unavailable: 'statusUnavailable', warning: 'statusWarning', error: 'statusError',
    review_required: 'statusReviewRequired', success: 'statusSuccess',
    'not screened': 'statusNotScreened',
    high: 'highRisk', medium: 'moderateRisk', low: 'lowRisk', normal: 'normalRisk',
    good: 'qualityGood', poor: 'qualityInsufficient', marginal: 'qualityMarginal',
    'not recorded': 'qualityNotRecorded',
  };
  const key = keys[(value || '').toLowerCase()];
  return key ? getTranslation(key, language) : value;
};

const localizedResult = (value: string, language: 'en' | 'hi' | 'ta') => {
  const normalized = (value || '').toLowerCase().replace(/[^a-z]/g, '');
  const keys: Record<string, TranslationKey> = {
    nodr: 'noDr',
    mild: 'mildDr',
    mildnpdr: 'mildDr',
    moderate: 'moderateDr',
    moderatedr: 'moderateDr',
    severe: 'severeDr',
    severenpdr: 'severeDr',
    proliferativedr: 'proliferativeDr',
  };
  const key = keys[normalized];
  return key ? getTranslation(key, language) : localizedStatus(value, language);
};

const localizedAuditAction = (action: string, language: 'en' | 'hi' | 'ta') => {
  const keys: Record<string, TranslationKey> = {
    'admin.login_success': 'auditSuccessfulSignIn',
    'doctor.login_success': 'auditSuccessfulSignIn',
    'doctor.registration_submitted': 'auditRegistrationSubmitted',
    'doctor.approve': 'auditDoctorApproved',
    'doctor.reject': 'auditDoctorRejected',
    'doctor.suspend': 'auditDoctorSuspended',
  };
  return keys[action] ? getTranslation(keys[action], language) : action;
};

export const AdminPortalView: React.FC = () => {
  const { currentUser, showToast, language } = usePortal();
  const t = (key: TranslationKey) => getTranslation(key, language);
  const [activeSection, setActiveSection] = useState<AdminSection>('overview');
  const [summary, setSummary] = useState<any>({});
  const [applications, setApplications] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [screenings, setScreenings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({ stage_distribution: [], monthly_trends: [], hospital_statistics: [] });
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [screeningSearch, setScreeningSearch] = useState('');

  const adminName = useMemo(() => currentUser?.admin?.name || 'DrishtiCare Admin', [currentUser]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [summaryData, applicationsData, doctorsData, patientsData, screeningsData, analyticsData, logsData, healthData] = await Promise.all([
        apiService.getAdminDashboardSummary(),
        apiService.getPendingDoctors(),
        apiService.getAdminDoctors(),
        apiService.getAdminPatients(),
        apiService.getAdminScreenings(),
        apiService.getAdminAnalytics(),
        apiService.getAdminAuditLogs(),
        apiService.getAdminSystemHealth(),
      ]);
      setSummary(summaryData);
      setApplications(applicationsData);
      setDoctors(doctorsData);
      setPatients(patientsData);
      setScreenings(screeningsData);
      setAnalytics(analyticsData);
      setAuditLogs(logsData);
      setHealth(healthData);
    } catch (error: any) {
      showToast(error.message || 'Unable to load admin workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAdminData();
  }, []);

  const handleReview = async (doctorId: string, decision: 'approve' | 'reject' | 'suspend') => {
    try {
      const result = await apiService.reviewDoctorApplication(doctorId, decision);
      showToast(`${result.name || 'Doctor'} ${t('statusUpdated')} ${localizedStatus(result.verification_status, language)}.`);
      await fetchAdminData();
    } catch (error: any) {
      showToast(error.message || 'Doctor access update failed.');
    }
  };

  const title = t(navigation.find((section) => section.id === activeSection)?.label || 'overview');
  const reviewCases = [
    ...applications,
    ...doctors.filter((doctor) => doctor.verification_status === 'INCOMPLETE'),
  ];
  const visiblePatients = patients.filter((patient) => `${patient.name} ${patient.patient_id} ${patient.doctor_name || ''}`.toLowerCase().includes(patientSearch.toLowerCase()));
  const visibleScreenings = screenings.filter((screening) => `${screening.screening_id} ${screening.patient_name} ${screening.doctor_name || ''} ${screening.result || ''}`.toLowerCase().includes(screeningSearch.toLowerCase()));
  const maximumStageCount = Math.max(1, ...analytics.stage_distribution.map((row: any) => row.count));
  const maximumMonthCount = Math.max(1, ...analytics.monthly_trends.map((row: any) => row.count));

  const metricCards = [
    { label: t('totalDoctors'), value: summary.total_doctors ?? 0, icon: 'stethoscope', tone: 'text-cyan-700 bg-cyan-50' },
    { label: t('totalPatients'), value: summary.total_patients ?? 0, icon: 'group', tone: 'text-indigo-700 bg-indigo-50' },
    { label: t('totalScreenings'), value: summary.total_screenings ?? 0, icon: 'monitor_heart', tone: 'text-teal-700 bg-teal-50' },
    { label: t('pendingVerification'), value: summary.pending_requests ?? 0, icon: 'pending_actions', tone: 'text-amber-700 bg-amber-50' },
    { label: t('highRiskReferrals'), value: summary.referrals ?? 0, icon: 'clinical_notes', tone: 'text-rose-700 bg-rose-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto grid max-w-[1600px] gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">
          <div className="flex items-center gap-3 border-b border-slate-100 px-2 pb-4">
            <span className="material-symbols-outlined flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-800">admin_panel_settings</span>
            <div>
              <p className="text-sm font-bold text-slate-800">DrishtiCare</p>
              <p className="text-xs text-slate-500">{t('adminWorkspace')}</p>
            </div>
          </div>

          <nav aria-label={t('adminNavigation')} className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-1">
            {navigation.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                aria-current={activeSection === item.id ? 'page' : undefined}
                className={`flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-2.5 text-left text-xs font-semibold transition sm:text-sm ${activeSection === item.id ? 'bg-cyan-50 text-cyan-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <span className="material-symbols-outlined shrink-0 text-[19px]">{item.icon}</span>
                <span className="truncate">{t(item.label)}</span>
                {item.id === 'verification' && summary.pending_requests > 0 && <span className="ml-auto rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">{summary.pending_requests}</span>}
              </button>
            ))}
          </nav>

          <div className="mt-auto hidden rounded-lg bg-slate-50 p-3 lg:block">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> {t('signedInAdmin')}
            </div>
            <p className="mt-1 truncate text-xs text-slate-500">{adminName}</p>
          </div>
        </aside>

        <main className="min-w-0">
          <header className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">{t('administration')}</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-slate-500 sm:inline">{adminName}</span>
              <button type="button" onClick={() => void fetchAdminData()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-3.5 py-2 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-60">
                <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                {t('refreshData')}
              </button>
            </div>
          </header>

          {activeSection === 'overview' && (
            <section className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
                {metricCards.map((card) => (
                  <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-slate-500">{card.label}</span>
                      <span className={`material-symbols-outlined flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}>{card.icon}</span>
                    </div>
                    <div className="mt-3 text-3xl font-bold text-slate-900">{card.value}</div>
                  </div>
                ))}
              </div>
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,1fr)]">
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">{t('recentActivity')}</h2>
                    <button type="button" onClick={() => setActiveSection('screenings')} className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">{t('viewAll')}</button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {screenings.slice(0, 5).map((screening) => (
                      <div key={screening.screening_id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{screening.patient_name} <span className="font-normal text-slate-500">· {screening.screening_id}</span></p>
                          <p className="mt-0.5 text-xs text-slate-500">{screening.doctor_name || t('unassigned')} · {formatDate(screening.created_at, language)}</p>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(screening.review_status)}`}>{screening.result ? localizedResult(screening.result, language) : localizedStatus(screening.status, language)}</span>
                      </div>
                    ))}
                    {!screenings.length && <p className="py-8 text-center text-sm text-slate-500">{t('noScreenings')}</p>}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-bold text-slate-900">{t('platformStatus')}</h2>
                    <button type="button" onClick={() => setActiveSection('health')} className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">{t('details')}</button>
                  </div>
                  <HealthSummary health={health} language={language} />
                  <button type="button" onClick={() => setActiveSection('verification')} className="mt-5 flex w-full items-center justify-between rounded-lg bg-amber-50 px-3 py-3 text-left text-sm font-semibold text-amber-900">
                    <span>{t('awaitingReview')}</span><span>{summary.pending_requests ?? 0}</span>
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeSection === 'verification' && (
            <DataPanel title={t('verificationQueue')} description={t('reviewSubmittedCredentials')}>
              {loading ? <LoadingState message={t('loadingWorkspace')} /> : reviewCases.length === 0 ? <EmptyState message={t('noApplications')} /> : (
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-left text-sm">
                    <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">{t('applicant')}</th><th className="px-3 py-3">{t('registration')}</th><th className="px-3 py-3">{t('credentials')}</th><th className="px-3 py-3">{t('evidence')}</th><th className="px-3 py-3">{t('statusAction')}</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {reviewCases.map((doctor) => (
                        <tr key={doctor.doctor_id} className="align-top">
                          <td className="px-3 py-4"><p className="font-semibold text-slate-900">{doctor.name}</p><p className="text-xs text-slate-500">{doctor.email || t('noEmail')} · {doctor.phone || t('noPhone')}</p><p className="mt-1 text-xs text-slate-500">{doctor.hospital_name || doctor.hospital || t('hospitalNotProvided')}</p></td>
                          <td className="px-3 py-4"><p className="font-medium text-slate-800">{doctor.medical_registration_number || t('registrationMissing')}</p><p className="text-xs text-slate-500">{doctor.medical_council || t('councilNotProvided')}</p></td>
                          <td className="px-3 py-4"><p className="text-slate-800">{doctor.qualification || t('qualificationMissing')}</p><p className="text-xs text-slate-500">{doctor.hospital_address || t('addressNotProvided')}</p></td>
                          <td className="px-3 py-4">{doctor.certificate_path ? <a href={doctor.certificate_path} target="_blank" rel="noreferrer" className="font-semibold text-cyan-700 underline">{t('viewCertificate')}</a> : <span className="text-slate-400">{t('noCertificate')}</span>}</td>
                          <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(doctor.verification_status)}`}>{localizedStatus(doctor.verification_status, language)}</span>
                            {doctor.verification_status === 'INCOMPLETE' ? <p className="mt-2 max-w-48 text-xs text-amber-800">{t('incompleteRegistration')}</p> : <div className="mt-2 flex gap-2"><button type="button" onClick={() => void handleReview(doctor.doctor_id, 'approve')} className="rounded-md bg-emerald-700 px-2.5 py-1.5 text-xs font-semibold text-white">{t('approve')}</button><button type="button" onClick={() => void handleReview(doctor.doctor_id, 'reject')} className="rounded-md bg-rose-700 px-2.5 py-1.5 text-xs font-semibold text-white">{t('reject')}</button></div>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </DataPanel>
          )}

          {activeSection === 'doctors' && (
            <DataPanel title={t('doctorDirectory')} description={t('doctorDirectoryDesc')}>
              {loading ? <LoadingState message={t('loadingWorkspace')} /> : <div className="overflow-x-auto"><table className="min-w-[800px] w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">{t('doctorPortal')}</th><th className="px-3 py-3">{t('hospitalDepartment')}</th><th className="px-3 py-3">{t('registration')}</th><th className="px-3 py-3">{t('status')}</th><th className="px-3 py-3">{t('access')}</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{doctors.map((doctor) => <tr key={doctor.doctor_id}>
                  <td className="px-3 py-4"><p className="font-semibold text-slate-900">{doctor.name}</p><p className="text-xs text-slate-500">{doctor.doctor_id} · {doctor.email || 'No email'}</p></td>
                  <td className="px-3 py-4"><p className="text-slate-800">{doctor.hospital_name || doctor.hospital || t('notListed')}</p><p className="text-xs text-slate-500">{doctor.department || doctor.qualification || t('notListed')}</p></td>
                  <td className="px-3 py-4"><p className="text-slate-800">{doctor.medical_registration_number || t('missing')}</p><p className="text-xs text-slate-500">{doctor.medical_council || t('notListed')}</p></td>
                  <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(doctor.verification_status)}`}>{localizedStatus(doctor.verification_status || 'INCOMPLETE', language)}</span></td>
                  <td className="px-3 py-4">{doctor.verification_status === 'VERIFIED' ? <button type="button" onClick={() => void handleReview(doctor.doctor_id, 'suspend')} className="rounded-md border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">{t('suspendAccess')}</button> : doctor.verification_status === 'SUSPENDED' ? <button type="button" onClick={() => void handleReview(doctor.doctor_id, 'approve')} className="rounded-md border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">{t('restoreAccess')}</button> : <span className="text-xs text-slate-400">{t('noAccess')}</span>}</td>
                </tr>)}</tbody>
              </table></div>}
            </DataPanel>
          )}

          {activeSection === 'patients' && (
            <DataPanel title={t('patientManagement')} description={t('patientRecordsDescription')} action={<SearchInput value={patientSearch} onChange={setPatientSearch} placeholder={t('searchPatients')} />}>
              {loading ? <LoadingState message={t('loadingWorkspace')} /> : <div className="overflow-x-auto"><table className="min-w-[780px] w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">{t('patientLabel')}</th><th className="px-3 py-3">{t('assignedDoctor')}</th><th className="px-3 py-3">{t('screeningCount')}</th><th className="px-3 py-3">{t('latestResult')}</th><th className="px-3 py-3">{t('review')}</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{visiblePatients.map((patient) => <tr key={patient.patient_id}>
                  <td className="px-3 py-4"><p className="font-semibold text-slate-900">{patient.name}</p><p className="text-xs text-slate-500">{patient.patient_id} · {patient.age} · {patient.gender}</p></td>
                  <td className="px-3 py-4"><p className="text-slate-800">{patient.doctor_name || t('notListed')}</p><p className="text-xs text-slate-500">{patient.doctor_id || ''}</p></td>
                  <td className="px-3 py-4"><p className="font-semibold text-slate-800">{patient.screenings_count}</p><p className="text-xs text-slate-500">{formatDate(patient.latest_screening_date, language)}</p></td>
                  <td className="px-3 py-4">{patient.latest_result ? localizedResult(patient.latest_result, language) : t('statusNotScreened')} <span className="text-xs text-slate-500">({localizedStatus(patient.latest_risk_level, language)})</span></td>
                  <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(patient.latest_review_status || '')}`}>{patient.latest_review_status ? localizedStatus(patient.latest_review_status, language) : t('notListed')}</span></td>
                </tr>)}</tbody>
              </table>{!visiblePatients.length && <EmptyState message={t('noPatientsMatch')} />}</div>}
            </DataPanel>
          )}

          {activeSection === 'screenings' && (
            <DataPanel title={t('screeningMonitoring')} description={t('screeningActivityDescription')} action={<SearchInput value={screeningSearch} onChange={setScreeningSearch} placeholder={t('searchScreenings')} />}>
              {loading ? <LoadingState message={t('loadingWorkspace')} /> : <div className="overflow-x-auto"><table className="min-w-[950px] w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">{t('screening')}</th><th className="px-3 py-3">{t('patientLabel')} / {t('doctorPortal')}</th><th className="px-3 py-3">{t('date')}</th><th className="px-3 py-3">{t('aiResult')}</th><th className="px-3 py-3">{t('qualityConfidence')}</th><th className="px-3 py-3">{t('review')}</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{visibleScreenings.map((screening) => <tr key={screening.screening_id}>
                  <td className="px-3 py-4"><p className="font-semibold text-slate-900">{screening.screening_id}</p><p className="text-xs text-slate-500">{screening.hospital}</p></td>
                  <td className="px-3 py-4"><p className="text-slate-800">{screening.patient_name}</p><p className="text-xs text-slate-500">{screening.doctor_name || t('notListed')}</p></td>
                  <td className="px-3 py-4 text-slate-600">{formatDate(screening.created_at, language)}</td>
                  <td className="px-3 py-4"><p className="font-semibold text-slate-800">{localizedResult(screening.result, language)}</p><p className="text-xs text-slate-500">{localizedStatus(screening.status, language)}</p></td>
                  <td className="px-3 py-4"><p className="text-slate-800">{screening.quality_decision}{screening.quality_score != null ? ` · ${screening.quality_score}/100` : ''}</p><p className="text-xs text-slate-500">{t('aiConfidence')} {Math.round(screening.confidence_percent || 0)}%</p></td>
                  <td className="px-3 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(screening.review_status)}`}>{localizedStatus(screening.review_status, language)}</span></td>
                </tr>)}</tbody>
              </table>{!visibleScreenings.length && <EmptyState message={t('noScreeningsMatch')} />}</div>}
            </DataPanel>
          )}

          {activeSection === 'analytics' && (
            <section className="space-y-5">
              <div className="grid gap-5 xl:grid-cols-2">
                <DataPanel title={t('drSeverityTitle')} description={t('successfulClassifications')}>
                  <div className="space-y-4">{analytics.stage_distribution.map((row: any) => <div key={row.stage}>
                    <div className="mb-1 flex justify-between text-sm"><span className="text-slate-700">{row.stage}</span><span className="font-semibold text-slate-900">{row.count}</span></div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-cyan-700" style={{ width: `${Math.max(3, (row.count / maximumStageCount) * 100)}%` }} /></div>
                  </div>)}{!analytics.stage_distribution.length && <EmptyState message={t('noClassifications')} />}</div>
                </DataPanel>
                <DataPanel title={t('monthlyTrend')} description={t('calendarMonthGrouping')}>
                  <div className="flex h-56 items-end gap-2 overflow-x-auto border-b border-slate-200 px-1 pt-3">{analytics.monthly_trends.slice(-12).map((row: any) => <div key={row.month} className="flex h-full min-w-10 flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] font-semibold text-slate-600">{row.count}</span><div className="w-full max-w-10 rounded-t bg-teal-600" style={{ height: `${Math.max(4, (row.count / maximumMonthCount) * 75)}%` }} /><span className="pb-2 text-[10px] text-slate-500">{row.month.slice(5)}</span>
                  </div>)}{!analytics.monthly_trends.length && <div className="m-auto text-sm text-slate-500">{t('noMonthlyActivity')}</div>}</div>
                </DataPanel>
              </div>
              <DataPanel title={t('hospitalStatistics')} description={t('hospitalStatisticsDescription')}>
                <div className="overflow-x-auto"><table className="min-w-[520px] w-full text-left text-sm"><thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">{t('hospitalDepartment')}</th><th className="px-3 py-3">{t('totalScreenings')}</th><th className="px-3 py-3">{t('highRiskReferralsColumn')}</th></tr></thead><tbody className="divide-y divide-slate-100">{analytics.hospital_statistics.map((row: any) => <tr key={row.hospital}><td className="px-3 py-3 font-medium text-slate-800">{row.hospital}</td><td className="px-3 py-3">{row.screenings}</td><td className="px-3 py-3">{row.referrals}</td></tr>)}</tbody></table>{!analytics.hospital_statistics.length && <EmptyState message={t('noHospitalActivity')} />}</div>
              </DataPanel>
            </section>
          )}

          {activeSection === 'audit' && (
            <DataPanel title={t('auditHistory')} description={t('auditHistoryDesc')}>
              {loading ? <LoadingState message={t('loadingWorkspace')} /> : <div className="overflow-x-auto"><table className="min-w-[760px] w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500"><tr><th className="px-3 py-3">{t('time')}</th><th className="px-3 py-3">{t('actor')}</th><th className="px-3 py-3">{t('action')}</th><th className="px-3 py-3">{t('record')}</th><th className="px-3 py-3">{t('details')}</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{auditLogs.map((log) => <tr key={log.id}><td className="whitespace-nowrap px-3 py-3 text-slate-600">{formatDate(log.created_at, language)}</td><td className="px-3 py-3"><p className="font-medium text-slate-800">{log.actor_id}</p><p className="text-xs text-slate-500">{log.actor_type}</p></td><td className="px-3 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{localizedAuditAction(log.action, language)}</span></td><td className="px-3 py-3 text-slate-700">{log.entity_type}{log.entity_id ? ` · ${log.entity_id}` : ''}</td><td className="px-3 py-3 text-slate-600">{log.details || '—'}</td></tr>)}</tbody>
              </table>{!auditLogs.length && <EmptyState message={t('noAuditEvents')} />}</div>}
            </DataPanel>
          )}

          {activeSection === 'health' && (
            <DataPanel title={t('systemHealth')} description={t('healthDescription')}>
              {!health ? <LoadingState message={t('loadingWorkspace')} /> : <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <HealthCard label={t('api')} value={health.status} language={language} />
                <HealthCard label={t('database')} value={health.database} language={language} />
                <HealthCard label={t('inferenceEngine')} value={health.matlab_engine} language={language} />
                <HealthCard label={t('model')} value={typeof health.model === 'string' ? health.model : JSON.stringify(health.model)} language={language} />
              </div>}
            </DataPanel>
          )}
        </main>
      </div>
    </div>
  );
};

const DataPanel: React.FC<{ title: string; description?: string; action?: React.ReactNode; children: React.ReactNode }> = ({ title, description, action, children }) => (
  <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
      <div><h2 className="font-bold text-slate-900">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>
      {action}
    </div>
    {children}
  </section>
);

const SearchInput: React.FC<{ value: string; onChange: (value: string) => void; placeholder: string }> = ({ value, onChange, placeholder }) => (
  <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-cyan-600">
    <span className="material-symbols-outlined text-[18px] text-slate-400">search</span>
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-48 bg-transparent text-sm outline-none placeholder:text-slate-400" />
  </label>
);

const EmptyState: React.FC<{ message: string }> = ({ message }) => <p className="py-8 text-center text-sm text-slate-500">{message}</p>;
const LoadingState: React.FC<{ message: string }> = ({ message }) => <p className="py-8 text-center text-sm text-slate-500">{message}</p>;

const HealthSummary: React.FC<{ health: any; language: 'en' | 'hi' | 'ta' }> = ({ health, language }) => health ? (
  <div className="space-y-3">
    {[[getTranslation('api', language), health.status], [getTranslation('database', language), health.database], [getTranslation('inferenceEngine', language), health.matlab_engine]].map(([label, value]) => (
      <div key={label} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 text-sm">
        <span className="text-slate-600">{label}</span><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(String(value))}`}>{localizedStatus(String(value), language)}</span>
      </div>
    ))}
  </div>
) : <p className="text-sm text-slate-500">{getTranslation('healthUnavailable', language)}</p>;

const HealthCard: React.FC<{ label: string; value: string; language: 'en' | 'hi' | 'ta' }> = ({ label, value, language }) => (
  <div className="rounded-lg border border-slate-200 p-4">
    <p className="text-sm text-slate-500">{label}</p>
    <p className={`mt-2 break-words text-sm font-semibold ${statusClass(value)} inline-flex rounded-full px-2.5 py-1`}>{localizedStatus(value, language)}</p>
  </div>
);
