// -----------------------------------------------------------------------------
// app/story/[slug]/storyboard/page.tsx — redirect (1.2).
//
// The Outline folded into the album page as a section (#outline). This route
// stays as a permanent redirect so anything bookmarked to /storyboard still
// lands somewhere sensible — a named breaking change, mitigated.
// -----------------------------------------------------------------------------

import { redirect } from 'next/navigation';

export default function StoryboardRedirect({ params }: { params: { slug: string } }) {
  redirect(`/story/${params.slug}#outline`);
}
