import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { StatsCard } from '../components/dashboard/StatsCard';
import { RecentMeasurementsTable } from '../components/dashboard/RecentMeasurementsTable';
import { ExposureChart } from '../components/dashboard/ExposureChart';
import { StatusBreakdown } from '../components/dashboard/StatusBreakdown';
import { ActivityFeed } from '../components/dashboard/ActivityFeed';
import { Modal } from '../components/common/Modal';
import { MeasurementResultCard } from '../components/measure/MeasurementResultCard';
import { ActiveTab } from '../components/layout/Sidebar';
import { Users, Cpu, Radio, AlertOctagon, Layers, Camera } from 'lucide-react';
import { Measurement } from '../types';

interface DashboardPageProps {
  setActiveTab: (tab: ActiveTab) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab }) => {
  const { workers, devices, measurements, activityLogs, lookupDevice, lookupStrip, lookupWorker } = useData();

  const [selectedMeasurement, setSelectedMeasurement] = useState<Measurement | null>(null);

  // Top Metrics
  const activeWorkers = workers.filter(w => w.status === 'ACTIVE').length;
  const activeDevices = devices.filter(d => d.status === 'CONNECTED' || d.status === 'REGISTERED').length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const measurementsToday = measurements.filter(m => m.timestamp.startsWith(todayStr)).length || measurements.length;
  const highExposureCount = measurements.filter(m => m.exposureStatus === 'HIGH').length;

  return (
    <div className="space-y-6">
      {/* Top 4 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Active Workers"
          value={activeWorkers}
          subtitle="Assigned to monitoring"
          icon={Users}
          color="cyan"
          trend={`${workers.length} Total Registered`}
        />

        <StatsCard
          title="Active Reader Fleet"
          value={activeDevices}
          subtitle="NFC powered units"
          icon={Cpu}
          color="amber"
          trend="100% Battery-Free"
        />

        <StatsCard
          title="Telemetry Scans Today"
          value={measurementsToday}
          subtitle="Hybrid NFC + Camera"
          icon={Radio}
          color="emerald"
          trend="Dual Method Record"
        />

        <StatsCard
          title="High Exposure Alerts"
          value={highExposureCount}
          subtitle="Over 25.0 ppm·h"
          icon={AlertOctagon}
          color="rose"
          trendType="danger"
          trend={highExposureCount > 0 ? 'Action Required' : 'Nominal'}
        />
      </div>

      {/* Main Grid Section A & B */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Exposure Overview Chart */}
        <div className="lg:col-span-2">
          <ExposureChart measurements={measurements} />
        </div>

        {/* Right 1 Column: Exposure Category Status Breakdown */}
        <div>
          <StatusBreakdown measurements={measurements} />
        </div>
      </div>

      {/* Section C & D: Recent Measurements & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Recent Measurements Table */}
        <div className="lg:col-span-2">
          <RecentMeasurementsTable
            measurements={measurements}
            workers={workers}
            onSelectMeasurement={(m) => setSelectedMeasurement(m)}
            onViewAll={() => setActiveTab('history')}
          />
        </div>

        {/* Right 1 Column: Activity Feed */}
        <div>
          <ActivityFeed activityLogs={activityLogs} />
        </div>
      </div>

      {/* Detailed Measurement Inspector Modal */}
      {selectedMeasurement && (
        <Modal
          isOpen={!!selectedMeasurement}
          onClose={() => setSelectedMeasurement(null)}
          title={`Measurement Record: ${selectedMeasurement.measurementId}`}
          subtitle="Hybrid Telemetry & Optical Absorbance Inspection"
          maxWidth="xl"
        >
          <MeasurementResultCard
            measurement={selectedMeasurement}
            device={lookupDevice(selectedMeasurement.deviceId)}
            strip={lookupStrip(selectedMeasurement.stripId)}
            worker={lookupWorker(selectedMeasurement.workerId)}
          />
        </Modal>
      )}
    </div>
  );
};
