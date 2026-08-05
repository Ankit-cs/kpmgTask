import { redirect } from 'next/navigation';

export default function StudentRootPage() {
  // Redirect /student directly to /student/assignments
  redirect('/student/assignments');
}
