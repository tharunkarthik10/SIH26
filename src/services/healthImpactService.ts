import { ExposureStatus } from '../types';

export interface HealthImpactAssessment {
  status: ExposureStatus;
  riskTitle: string;
  physiologicalDamage: string;
  recommendedAction: string;
  mandatoryRestPeriod: string; // e.g. "No Rest Required", "Mandatory 45-Minute Rest", "MANDATORY 24-HOUR MEDICAL LEAVE"
  isMedicalLeaveRequired: boolean;
  heartRateFactor: string;
  medicalConditionFactor: string;
  overallRiskCategory: 'Nominal' | 'Elevated Risk' | 'Critical Toxicity Hazard';
  alertLevel: 'low' | 'moderate' | 'critical';
}

/**
 * Calculates human physiological health impact, mandatory rest periods, and medical leave recommendations 
 * based on cumulative H2S gas exposure (ppm·h), live heart rate (BPM), and pre-existing medical conditions.
 */
export const assessHealthImpact = (
  exposurePpmH: number,
  heartRate: number = 78,
  medicalCondition: string = 'Asthma / Respiratory Hypersensitivity'
): HealthImpactAssessment => {
  const condLower = (medicalCondition || '').toLowerCase();
  const isRespiratoryCondition = condLower.includes('asthma') || condLower.includes('bronchitis') || condLower.includes('respiratory') || condLower.includes('lung');
  const isCardiacCondition = condLower.includes('cardiac') || condLower.includes('heart') || condLower.includes('hypertension');
  const isElevatedHR = heartRate > 95;
  const isHighHR = heartRate > 115;

  // 1. CRITICAL EXPOSURE (>= 25 ppm·h) or HIGH HR + CARDIAC CONDITION
  if (exposurePpmH >= 25.0 || (exposurePpmH >= 10.0 && (isCardiacCondition || isHighHR))) {
    return {
      status: 'HIGH',
      riskTitle: 'CRITICAL TOXIC HAZARD & MEDICAL LEAVE ALERT',
      physiologicalDamage: `High cumulative gas dosage (${exposurePpmH.toFixed(1)} ppm·h). Heart rate (${heartRate} BPM) and ${medicalCondition} severely amplify systemic cellular hypoxia, airway inflammation, and acute pulmonary edema risk.`,
      recommendedAction: 'IMMEDIATE EVACUATION REQUIRED. Remove worker from site immediately. Mandate 100% fresh air isolation, emergency oxygen, and toxicology evaluation.',
      mandatoryRestPeriod: 'MANDATORY MEDICAL LEAVE: Immediate 24-Hour Shift Removal & Hospital Evaluation Required',
      isMedicalLeaveRequired: true,
      heartRateFactor: `Elevated Heart Rate (${heartRate} BPM) accelerates alveolar H₂S gas absorption by ~45%.`,
      medicalConditionFactor: `${medicalCondition}: High vulnerability to toxic gas complications.`,
      overallRiskCategory: 'Critical Toxicity Hazard',
      alertLevel: 'critical',
    };
  } 
  
  // 2. MODERATE EXPOSURE (10 - 25 ppm·h) or LOW EXPOSURE WITH ASTHMA/ELEVATED HR
  else if (exposurePpmH >= 10.0 || (isElevatedHR && isRespiratoryCondition)) {
    const requiresShiftLeave = exposurePpmH >= 18.0 && (isRespiratoryCondition || isCardiacCondition);
    const restMinutes = isRespiratoryCondition || isElevatedHR ? 45 : 30;

    return {
      status: 'MODERATE',
      riskTitle: requiresShiftLeave ? 'MANDATORY MEDICAL SHIFT LEAVE' : 'ELEVATED RESPIRATORY IRRITATION WARNING',
      physiologicalDamage: `Moderate gas accumulation (${exposurePpmH.toFixed(1)} ppm·h). ${medicalCondition} combined with elevated pulse (${heartRate} BPM) causes accelerated mucous membrane irritation, bronchial hyper-reactivity, and headache.`,
      recommendedAction: requiresShiftLeave
        ? 'Remove worker from chemical plant zone for the remainder of current 12-hour shift. Schedule respiratory check.'
        : `Move worker to fresh air ventilation zone for a mandatory ${restMinutes}-minute rest break. Inspect PPE mask seals.`,
      mandatoryRestPeriod: requiresShiftLeave 
        ? 'MANDATORY MEDICAL LEAVE: 12-Hour Shift Removal Required' 
        : `Mandatory ${restMinutes}-Minute Rest Break in Clean Air Zone`,
      isMedicalLeaveRequired: requiresShiftLeave,
      heartRateFactor: isElevatedHR ? `Elevated Heart Rate (${heartRate} BPM) increases respiratory gas uptake.` : `Resting Heart Rate: ${heartRate} BPM.`,
      medicalConditionFactor: `${medicalCondition}: Heightened sensitivity to respiratory irritants.`,
      overallRiskCategory: 'Elevated Risk',
      alertLevel: 'moderate',
    };
  } 
  
  // 3. LOW EXPOSURE (< 10 ppm·h)
  else {
    const hasPrecautionaryRest = isRespiratoryCondition && isElevatedHR;

    return {
      status: 'LOW',
      riskTitle: hasPrecautionaryRest ? 'PRECAUTIONARY REST BREAK' : 'SAFE WORKING RANGE (NOMINAL)',
      physiologicalDamage: `Sub-threshold gas exposure (${exposurePpmH.toFixed(1)} ppm·h). Baseline vitals (${heartRate} BPM, ${medicalCondition}) show stable physiological response within OSHA 8-hr TWA limit.`,
      recommendedAction: hasPrecautionaryRest
        ? 'Worker should take a precautionary 15-minute hydration & fresh air break to normalize pulse before continuing work.'
        : 'Continue standard task operations while wearing passive colorimetric dosimeter.',
      mandatoryRestPeriod: hasPrecautionaryRest ? 'Precautionary 15-Minute Rest Break' : 'No Rest Required (Nominal Shift Status)',
      isMedicalLeaveRequired: false,
      heartRateFactor: `Heart Rate: ${heartRate} BPM (Normal Baseline Telemetry).`,
      medicalConditionFactor: `Recorded Medical Baseline: ${medicalCondition}.`,
      overallRiskCategory: 'Nominal',
      alertLevel: 'low',
    };
  }
};
