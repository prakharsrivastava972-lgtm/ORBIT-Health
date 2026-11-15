import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" description="That address does not match any ORBIT Health page." />
      <Link
        to="/"
        className="inline-flex rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm text-accent hover:bg-accent/20"
      >
        Back to Mission Overview
      </Link>
    </>
  );
}