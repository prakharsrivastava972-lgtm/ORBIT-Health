import PageHeader from '@/components/ui/PageHeader';
import DataPanel from '@/components/settings/DataPanel';
import ProfilePanel from '@/components/settings/ProfilePanel';
import ScenarioPanel from '@/components/settings/ScenarioPanel';
import ThresholdPanel from '@/components/settings/ThresholdPanel';
import { useActiveProfile } from '@/store/useAppStore';

export default function SettingsPage() {
  const profile = useActiveProfile();
  return (
    <>
      <PageHeader
        title="Settings"
        description="Mission settings, astronaut profile management, units and demo scenarios."
      />
      <div className="space-y-6">
        <ScenarioPanel key={`scn-${profile.id}`} profile={profile} />
        <ProfilePanel key={`prof-${profile.id}`} profile={profile} />
        <ThresholdPanel key={`thr-${profile.id}`} profile={profile} />
        <DataPanel />
      </div>
    </>
  );
}