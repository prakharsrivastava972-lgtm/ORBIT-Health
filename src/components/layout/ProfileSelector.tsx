import { useActiveProfile, useAppStore, useProfiles } from '@/store/useAppStore';

export default function ProfileSelector() {
  const profile = useActiveProfile();
  const profiles = useProfiles();
  const setActiveProfile = useAppStore((s) => s.setActiveProfile);

  return (
    <div>
      <label htmlFor="profile-select" className="sr-only">
        Astronaut profile
      </label>
      <select
        id="profile-select"
        value={profile.id}
        onChange={(e) => setActiveProfile(e.target.value)}
        className="max-w-[11rem] rounded-lg border border-line/60 bg-space-800 px-3 py-2 text-sm text-ink hover:border-accent/50"
      >
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.callsign} · {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}