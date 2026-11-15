import { Hourglass } from 'lucide-react';
import PageHeader from './PageHeader';

interface Props {
  title: string;
  description: string;
  phase: number;
  planned: string[];
}

/** Temporary stub. Each page is replaced with its real implementation in the phase shown. */
export default function PagePlaceholder({ title, description, phase, planned }: Props) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <section className="panel p-5 animate-fade-up" aria-labelledby="planned-heading">
        <div className="mb-3 flex items-center gap-2 text-accent">
          <Hourglass className="h-4 w-4" aria-hidden="true" />
          <h2 id="planned-heading" className="label-caps !text-accent">
            Built in Phase {phase}
          </h2>
        </div>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink-muted">
          {planned.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </>
  );
}