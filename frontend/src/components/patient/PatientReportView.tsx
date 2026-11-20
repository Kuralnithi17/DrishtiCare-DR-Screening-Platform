import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { RETINAL_ASSETS, DOCTOR_PROFILE } from '../../data/mockData';
import { getLocalizedFinding, getLocalizedRecommendation, getTranslation } from '../../data/translations';
import { PatientAiAssistant } from './PatientAiAssistant';
import { GradCamReadingBar } from '../common/GradCamReadingBar';

export const PatientReportView: React.FC = () => {
  const { currentScreening, language, showToast } = usePortal();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleListenReport = () => {
    if ('speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
        return;
      }

      const findingText = getLocalizedFinding(currentScreening.aiResult.grade, currentScreening.aiResult.finding, currentScreening.aiResult.findingHi, language);
      const recText = getLocalizedRecommendation(currentScreening.aiResult.grade, currentScreening.aiResult.recommendation, currentScreening.aiResult.recommendationHi, language);

      const textEn = `Your Eye Screening Report for ${currentScreening.eye}. Diagnosis: ${findingText}. Risk level: ${currentScreening.aiResult.riskLevel}. Verified by ${DOCTOR_PROFILE.name}. Recommendation: ${recText}`;
      const textHi = `आपके ${currentScreening.eye} की नेत्र स्क्रीनिंग रिपोर्ट। परिणाम: ${findingText}। जोखिम स्तर: ${currentScreening.aiResult.riskLevel}। डॉक्टर अनीता द्वारा सत्यापित। डॉक्टर की सलाह: ${recText}`;

      const textTa = `கண் பரிசோதனை அறிக்கை. முடிவு: ${findingText}. ${recText}`;
      const speechText = language === 'ta' ? textTa : language === 'hi' ? textHi : textEn;
      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.95;
      utterance.lang = language === 'ta' ? 'ta-IN' : language === 'hi' ? 'hi-IN' : 'en-US';

      utterance.onstart = () => {
        setIsPlayingAudio(true);
        showToast(language === 'hi' ? 'रिपोर्ट ऑडियो शुरू हुआ...' : language === 'ta' ? 'அறிக்கை ஒலிப்பதிவு தொடங்கியது...' : 'Playing audio narration of screening report...');
      };
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
    } else {
      showToast('Audio narration not supported in this browser.');
    }
  };

  const handleDownloadPdf = () => {
    showToast(language === 'hi' ? 'पीडीएफ रिपोर्ट तैयार की जा रही है...' : language === 'ta' ? 'அறிக்கை தயாராகிறது...' : 'Generating patient PDF medical report...');
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleShare = () => {
    const verifiedDoctor = currentScreening.review.verifiedBy || 'Treating Clinician';
    if (navigator.share) {
      navigator
        .share({
          title: 'DrishtiCare Eye Screening Report',
          text: `DrishtiCare DR Screening Report for ${currentScreening.patientName} (${currentScreening.screeningDate}): ${currentScreening.aiResult.finding}. Verified by ${verifiedDoctor}.`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast(language === 'hi' ? 'रिपोर्ट लिंक कॉपी किया गया' : language === 'ta' ? 'அறிக்கை இணைப்பு நகலெடுக்கப்பட்டது' : 'Report link copied to clipboard');
    }
  };

  const isHighRisk = currentScreening.aiResult.riskLevel === 'high';
  const isModerateRisk = currentScreening.aiResult.riskLevel === 'medium';

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header Section */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg text-primary font-bold mb-1">
            {getTranslation('yourScreeningResult', language)}
          </h1>
          <p className="text-xs text-on-surface-variant font-medium">
            Report ID: #{currentScreening.id} · {currentScreening.screeningDate}
          </p>
        </div>

        <div className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border w-fit ${
          isHighRisk
            ? 'bg-error-container text-on-error-container border-error/30'
            : isModerateRisk
            ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
            : 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]'
        }`}>
          <span className="material-symbols-outlined text-[16px]">
            {isHighRisk ? 'warning' : isModerateRisk ? 'priority_high' : 'check_circle'}
          </span>
          <span>
            {getTranslation(currentScreening.aiResult.riskLevel === 'high' ? 'highRisk' : currentScreening.aiResult.riskLevel === 'medium' ? 'moderateRisk' : currentScreening.aiResult.riskLevel === 'low' ? 'lowRisk' : 'normalRisk', language)} · {language === 'hi' ? 'डॉक्टर सत्यापित' : language === 'ta' ? 'மருத்துவர் சரிபார்த்தது' : 'Doctor Verified'}
          </span>
        </div>
      </div>

      {/* Action Bar: Audio Listen, Download PDF, Print, Share */}
      <div className="flex flex-wrap gap-2.5">
        <button
          onClick={handleListenReport}
          className={`h-11 px-5 rounded-full font-label-md text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 ${
            isPlayingAudio
              ? 'bg-[#E65100] text-white animate-pulse'
              : 'bg-primary-container text-white hover:bg-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isPlayingAudio ? 'stop_circle' : 'volume_up'}
          </span>
          <span>
            {isPlayingAudio
              ? (language === 'hi' ? 'रोकें' : language === 'ta' ? 'நிறுத்தவும்' : 'Stop Listening')
              : (language === 'hi' ? 'रिपोर्ट सुनें' : language === 'ta' ? 'அறிக்கையைக் கேட்கவும்' : 'Listen to Report')}
          </span>
        </button>

        <button
          onClick={handleDownloadPdf}
          className="h-11 px-5 rounded-full border border-primary-container text-primary-container font-label-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-secondary-fixed transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          <span>{getTranslation('downloadPdf', language)}</span>
        </button>

        <button
          onClick={() => window.print()}
          className="h-11 px-5 rounded-full border border-outline-variant text-on-surface font-label-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-surface-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">print</span>
          <span>{getTranslation('printReport', language)}</span>
        </button>

        <button
          onClick={handleShare}
          className="h-11 px-5 rounded-full border border-outline-variant text-on-surface font-label-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-surface-container transition-colors active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
          <span>{getTranslation('shareReport', language)}</span>
        </button>
      </div>

      {/* Primary Result & Simple Explanation Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-stack-lg shadow-[0_4px_16px_rgba(7,59,76,0.06)] border border-surface-container space-y-4">
        <div>
          <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block">
            {language === 'ta' ? 'நீரிழிவு விழித்திரை நோய் வகை' : 'Diabetic Retinopathy Classification'}
          </span>
          <h2 className="text-xl font-bold text-primary mt-1">
            {getLocalizedFinding(currentScreening.aiResult.grade, currentScreening.aiResult.finding, currentScreening.aiResult.findingHi, language)}
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {language === 'ta' ? 'பரிசோதித்த கண்' : 'Eye Examined'}: {currentScreening.eye} · {language === 'ta' ? 'கேமரா' : 'Camera'}: {currentScreening.fundusCameraModel}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">
            {language === 'hi' ? 'इसका क्या मतलब है?' : language === 'ta' ? 'இதன் பொருள் என்ன?' : 'What This Means'}
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
            {language === 'hi'
              ? 'जांच में आंख के पिछले हिस्से (रेटिना) में कुछ ऐसे लक्षण देखे गए हैं जिन पर नेत्र विशेषज्ञ का परामर्श जरूरी है। यह स्थायी दृष्टि हानि नहीं है, बल्कि समय रहते आंखों को स्वस्थ रखने के लिए एक महत्वपूर्ण चेतावनी है।'
              : language === 'ta'
                ? 'கண்ணின் பின்புறம் உள்ள விழித்திரையில் சில மாற்றங்கள் காணப்பட்டுள்ளன. அவற்றைப் பற்றி கண் மருத்துவரிடம் ஆலோசனை பெறவும். இது பார்வை நிரந்தரமாக இழந்துவிட்டது என்று பொருளல்ல; சரியான நேரத்தில் கவனம் செலுத்த உதவும் அறிகுறி.'
                : 'Our examination noted microvascular changes that require attention from an ophthalmologist. This does not mean permanent vision loss; it is an early protective signal to schedule an evaluation and safeguard your eye health.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#FFF8E1] border-l-4 border-[#FFA000] flex items-start gap-3">
          <span className="material-symbols-outlined text-[#F57C00] text-[22px] shrink-0 mt-0.5">
            medical_services
          </span>
          <div>
            <h4 className="text-xs font-bold text-[#E65100] uppercase tracking-wider">
              {getTranslation('recommendationTitle', language)}
            </h4>
            <p className="text-xs sm:text-sm font-medium text-[#795548] mt-0.5 leading-relaxed">
              {getLocalizedRecommendation(currentScreening.aiResult.grade, currentScreening.aiResult.recommendation, currentScreening.aiResult.recommendationHi, language)}
            </p>
          </div>
        </div>

        {/* Doctor verification badge */}
        <div className="flex items-center justify-between pt-2 border-t border-surface-container text-xs text-on-surface-variant">
          <span>
            <strong>{language === 'ta' ? 'சரிபார்த்தவர்:' : 'Verified By:'}</strong> {currentScreening.review.verifiedBy || 'Treating Clinician'}
          </span>
          <span>
            <strong>{language === 'ta' ? 'நிலை:' : 'Status:'}</strong> {currentScreening.review.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Visual Findings Card (Original + Grad-CAM Heatmap side-by-side) */}
      <div className="bg-surface-container-lowest rounded-2xl p-stack-lg shadow-[0_4px_16px_rgba(7,59,76,0.06)] border border-surface-container">
        <h3 className="font-headline-md text-base font-bold text-primary mb-1">
          {language === 'hi' ? 'दृश्य निष्कर्ष' : language === 'ta' ? 'படத்தில் கண்டறிந்தவை' : 'Visual Screening Findings'}
        </h3>
        <p className="text-xs text-on-surface-variant mb-4">
          {language === 'hi'
            ? 'मूल रेटिना तस्वीर और एआई ध्यान क्षेत्र (हीटमैप) की तुलना'
            : language === 'ta' ? 'அசல் விழித்திரைப் படத்தையும் AI கவனித்த பகுதிகளையும் ஒப்பிடுகிறது' : 'Comparison between your original retinal scan and the Explainable AI attention heatmap'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Original */}
          <div className="p-3 rounded-xl bg-surface border border-surface-container flex flex-col">
            <span className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">photo_camera</span>
              {getTranslation('tabOriginal', language)} ({currentScreening.eye})
            </span>
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-black flex items-center justify-center shadow-inner">
              <img
                src={currentScreening.images?.original || RETINAL_ASSETS.patientReportOriginal}
                alt="Original Retinal Image"
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-[11px] text-on-surface-variant mt-2 text-center">
              {language === 'ta' ? 'ஆரம்ப சுகாதார நிலையத்தில் எடுக்கப்பட்ட விழித்திரைப் படம்' : 'Clear digital retinal photograph taken at PHC'}
            </p>
          </div>

          {/* AI Heatmap */}
          <div className="p-3 rounded-xl bg-surface border border-surface-container flex flex-col relative">
            <span className="text-xs font-bold text-[#E65100] mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">heat_map</span>
              {getTranslation('tabGradCam', language)}
            </span>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-black flex items-center justify-center shadow-inner">
              <img
                src={currentScreening.images?.overlay || currentScreening.images?.heatmap || RETINAL_ASSETS.patientReportHeatmap}
                alt="AI Highlighted Heatmap"
                className="w-full h-full object-contain"
              />
              <GradCamReadingBar
                variant="overlay"
                language={language}
                className="absolute bottom-2 right-2 z-20 w-48 shadow-xl"
              />
            </div>
            <p className="text-[11px] text-on-surface-variant mt-2 text-center">
              {language === 'ta' ? 'AI ஆய்வு செய்த பகுதிகள் வண்ணத்தில் காட்டப்பட்டுள்ளன' : 'Highlighted regions indicate microvascular areas analyzed by AI'}
            </p>
          </div>
        </div>

        <GradCamReadingBar variant="inline" language={language} className="mt-4" />
      </div>

      {/* Patient AI Assistant Component */}
      <PatientAiAssistant />
    </div>
  );
};
