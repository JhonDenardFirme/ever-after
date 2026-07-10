// The root route has no content of its own — The Library is home.
// Middleware handles the signed-out case (bounces to /signin) before
// this redirect ever matters.

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/library');
}
