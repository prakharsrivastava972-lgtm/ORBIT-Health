import PageHeader from '@/components/ui/PageHeader';
import BiometricForm from '@/components/forms/BiometricForm';
import ReadingsTable from '@/components/ui/ReadingsTable';
import { useActiveProfile } from '@/store/useAppStore';
import { useMeasurements } from '@/store/useDataStore';

export default function BiometricsPage() {
  const profile = useActiveProfile();
  const { measurements, ready } = useMeasurements(profile);

  return (
    <>
      <PageHeader
        title="Biometrics"
        description="Record and review heart rate, blood pressure, temperature, glucose, SpO2, sleep, hydration and weight."
      />
      {!ready ? (
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[22rem_1fr]">
          <BiometricForm key={profile.id} profile={profile} />
          <ReadingsTable profile={profile} measurements={measurements} />
        </div>
      )}
    </>
  );
}