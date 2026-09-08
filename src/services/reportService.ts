import { Measurement, Worker } from '../types';
import { formatIndianDate, formatIndianFullDateTime } from '../utils/dateUtils';

export interface ReportSummary {
  totalMeasurements: number;
  lowExposureCount: number;
  moderateExposureCount: number;
  highExposureCount: number;
  averageExposure: number;
  highestExposure: number;
  dateRange: string;
}

export const generateReportSummary = (
  measurements: Measurement[],
  days: number = 30
): ReportSummary => {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const filtered = measurements.filter(m => new Date(m.timestamp) >= cutoff);

  let low = 0;
  let mod = 0;
  let high = 0;
  let sum = 0;
  let max = 0;

  filtered.forEach(m => {
    if (m.exposureStatus === 'LOW') low++;
    else if (m.exposureStatus === 'MODERATE') mod++;
    else if (m.exposureStatus === 'HIGH') high++;

    sum += m.estimatedExposure;
    if (m.estimatedExposure > max) max = m.estimatedExposure;
  });

  const avg = filtered.length > 0 ? Math.round((sum / filtered.length) * 10) / 10 : 0;

  return {
    totalMeasurements: filtered.length,
    lowExposureCount: low,
    moderateExposureCount: mod,
    highExposureCount: high,
    averageExposure: avg,
    highestExposure: max,
    dateRange: `Last ${days} Days (${formatIndianDate(cutoff)} - ${formatIndianDate(now)})`,
  };
};

/**
 * Downloads a formatted CSV file of measurement history
 */
export const exportMeasurementsToCSV = (
  measurements: Measurement[],
  workers: Worker[]
) => {
  const workerMap = new Map(workers.map(w => [w.workerId, w]));

  const headers = [
    'Measurement ID',
    'Timestamp',
    'Worker ID',
    'Worker Name',
    'Department',
    'Device ID',
    'Chemical Strip ID',
    'Optical Absorbance',
    'Estimated Exposure (ppm*h)',
    'Exposure Status',
    'Calibration Profile',
    'Disclaimer'
  ];

  const rows = measurements.map(m => {
    const worker = workerMap.get(m.workerId);
    return [
      m.measurementId,
      `"${formatIndianFullDateTime(m.timestamp)}"`,
      m.workerId,
      `"${worker ? worker.name : m.workerName || 'Unassigned'}"`,
      `"${worker ? worker.department : 'N/A'}"`,
      m.deviceId,
      m.stripId,
      m.opticalReading.toFixed(3),
      m.estimatedExposure.toFixed(1),
      m.exposureStatus,
      m.calibrationProfileId,
      `"${m.disclaimer}"`
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `h2s_exposure_report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
