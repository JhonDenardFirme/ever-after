// -----------------------------------------------------------------------------
// lib/copy.ts
//
// Every user-facing sentence in Ever After lives in this one file. This is the
// whole brand voice, centralized — if I ever hardcode English inside a
// component, that's a bug, not a shortcut. (Masterfile Rule 1: Ever After
// never speaks like software.)
//
// Phases 3-5 will keep adding keys here. Components only ever import `copy`.
// -----------------------------------------------------------------------------

export const copy = {
  brand: {
    name: 'Ever After',
    tagline: 'Every journey deserves an Ever After.',
  },

  signin: {
    eyebrow: 'Written one frame at a time',
    title: 'Ever After',
    lead: 'A storybook we write together.',
    google: 'Continue with Google',
    divider: 'or, someday',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    // The password form is decorative for now — real credentials auth is a
    // future phase. This note keeps Airhyl from being confused by a dead form.
    passwordSoon: 'Coming soon — use Google for now.',
    denied: "This story has two authors, and that account isn't one of them.",
  },

  library: {
    title: 'The Library',
    greeting: (name: string) => `Good to see you, ${name}.`,
    firstVisit: 'This is where every story you write together will live.',
    empty: 'Your story is waiting to begin.',
    begin: 'Begin a new chapter',
    // The little dialog that opens when you begin one.
    beginPrompt: 'What should we call it?',
    beginPlaceholder: 'Tagaytay II',
    beginConfirm: 'Begin',
    beginCancel: 'Not yet',
    beginError: "That story couldn't be started. Try again?",
    untitled: 'Untitled',
    // Shown under each tile
    noSetting: 'Somewhere, someday',
    // 1.2 — the shelf now sits below the couple hero and earns a heading of its own.
    shelfEyebrow: 'The Library',
    shelfTitle: 'Every story we’ve kept',
    shelfDescription:
      'Each spine below is a Fleeting Frames — a trip, a season, a day worth developing. Open one to read it again.',
    footer: 'Developed by Denard, with love.',
  },

  // The Story Frontispiece — the editorial opening spread on The Library.
  frontispiece: {
    eyebrow: 'The two of us',
    statement: 'Every Ever After is written one frame at a time.',
    authorRole: 'Author',
    stats: {
      since: 'Since',
      chapters: 'Chapters',
      frames: 'Frames',
      keepsakes: 'Keepsakes',
    },
    edit: 'Edit',
    editProfile: 'Edit',
    nameLabel: 'Name',
    namePlaceholder: 'Your name',
    nicknameLabel: 'Nickname',
    nicknamePlaceholder: 'Optional',
    changePhoto: 'Change photo',
    settingsTitle: 'Story settings',
    titleLabel: 'Title',
    titlePlaceholder: 'Denard & Airhyl',
    statementLabel: 'Editorial statement',
    statementPlaceholder: 'Every Ever After is written one frame at a time.',
    sinceLabel: 'Since',
    dedicationLabel: 'Dedication',
    dedicationPlaceholder: 'For the version of us that said yes.',
    heroLabel: 'Hero image',
    addHero: 'Add a hero image',
    changeHero: 'Change hero image',
    removeHero: 'Remove hero image',
    focusHint: 'Click the image to set its focal point.',
    save: 'Keep',
    cancel: 'Not yet',
    saving: 'Keeping…',
    saveError: "That didn't save. Try again?",
  },

  // The couple hero — the highlight of The Library. Editable, then it rests
  // back into a view. This is the "who we are" of the whole book.
  couple: {
    eyebrow: 'The two of us',
    headlinePlaceholder: 'Denard & Airhyl',
    storyPlaceholder: 'The short version of how we got here…',
    memberOne: { namePlaceholder: 'Your name', notePlaceholder: 'Hi, I’m…' },
    memberTwo: { namePlaceholder: 'Her name', notePlaceholder: 'Hi, I’m…' },
    greet: (name: string) => `Hi, I’m ${name}`,
    edit: 'Edit',
    save: 'Keep',
    cancel: 'Not yet',
    saving: 'Keeping…',
    saveError: "That didn't save. Try again?",
    addPhoto: 'Add a photo',
    changePhoto: 'Change photo',
    empty: 'Introduce the two of you.',
  },

  prologue: {
    eyebrow: 'The Prologue',
    back: 'Back to the library',
    coverEmpty: 'No cover yet — a Frame will find its way here.',
    // Field labels. Sans-serif, small caps, interface voice.
    labels: {
      title: 'Title',
      dates: 'When',
      setting: 'Setting',
      theme: 'Theme',
      dedication: 'Dedication',
      epigraph: 'Epigraph',
      description: 'Description',
      soundtrack: 'Soundtrack',
    },
    // Placeholders. Serif, story voice — these are invitations, not hints.
    placeholders: {
      title: 'Name this story',
      setting: 'Where does it happen?',
      theme: 'One word for how it felt',
      dedication: 'For the version of us that said yes.',
      epigraph: 'A line worth opening with.',
      description: 'What was this one about?',
      soundtrack: 'A song, a playlist, a link',
    },
    saving: 'Keeping…',
    saveError: "That didn't save. Try again?",
    startsOn: 'From',
    endsOn: 'Until',
    toStoryboard: 'Open the storyboard',
    // 1.2 — the Prologue now rests in a view; a small icon opens the form.
    sectionEyebrow: 'The Prologue',
    sectionTitle: 'How it began.',
    tagline: 'The opening pages — where and when, and the words we opened with.',
    edit: 'Edit the prologue',
    done: 'Done editing',
    empty: 'The Prologue is unwritten. Open it and begin.',
    // Cover controls
    cover: 'Cover',
    addCover: 'Add a cover',
    changeCover: 'Change cover',
    removeCover: 'Remove cover photo',
    coverUploading: 'Keeping…',
  },

  // The Spotify soundtrack (1.2). We store the pasted link in stories.soundtrack
  // and render Spotify's own embed for real playback — cross-origin autoplay
  // isn't ours to control, so the disc beside it is an honest flourish, not a
  // fake transport.
  soundtrack: {
    eyebrow: 'The Soundtrack',
    sectionTitle: 'What it sounded like.',
    tagline: 'The song that played underneath it all.',
    add: 'Add a soundtrack',
    prompt: 'Paste a Spotify link',
    placeholder: 'https://open.spotify.com/track/…',
    save: 'Keep',
    cancel: 'Not yet',
    edit: 'Change the song',
    saving: 'Keeping…',
    hint: 'Press play in the player to listen.',
    asNote: 'Kept as a note — paste a Spotify link for a player.',
    saveError: "That didn't save. Try again?",
  },

  storyboard: {
    eyebrow: 'The Outline',
    title: 'The Storyboard',
    // 1.2 — the Outline is now a section on the album, with a hero + invitation.
    sectionTitle: 'The plan we made.',
    tagline: 'The shape of the day — the Moments, in order.',
    heroTitle: 'The Outline',
    editOutline: 'Edit the outline',
    doneOutline: 'Done editing',
    invite: 'Share the invitation',
    invitationEyebrow: 'An invitation',
    invitationTitle: 'Come with me.',
    invitationLead: 'Here is the day I have in mind for us.',
    emptyInvite: 'Outline your Storyboard',
    lead: 'Sketch the day before it happens. Or don\'t — a story works either way.',
    empty: "Nothing's been sketched yet. Start wherever you like.",
    addBeat: 'Add a Moment',
    // The little inline form for a new beat
    newBeatPlaceholder: 'What happens?',
    newBeatConfirm: 'Add',
    newBeatCancel: 'Not yet',
    // Beat editor
    editorLabels: {
      title: 'What happens',
      notes: 'A line about it',
      time: 'When',
      setting: 'Where',
      type: 'Kind',
    },
    editorPlaceholders: {
      title: 'Name this beat',
      notes: 'Windows down once the air turns cool.',
      setting: 'Somewhere on the hill',
    },
    untimed: '\u2014', // 1.2: a quiet dash instead of a sentence eating space
    untimedHint: 'Untimed Moments sort last. Drag them to reorder.',
    timedHint: 'Timed Moments sort by the clock. Change the time to move it.',
    pastUndeveloped: 'This one came and went. Still worth a Frame, whenever you find it.',
    deleteBeat: 'Remove this Moment',
    deleteBeatConfirm: 'This Moment and everything in it will be gone for good.',
    confirmYes: 'Yes, let it go',
    confirmNo: 'Not yet',
    reordered: 'Your day, resequenced.',
    saveError: "That didn't save. Try again?",
    reorderError: "Your storyboard didn't save that change — give it another try.",
  },

  frameList: {
    title: 'The Frame List',
    lead: 'Frames worth chasing. Leave one for them to find.',
    empty: 'No Frames waiting to be developed — yet.',
    addWaiting: 'Leave a Waiting Frame',
    promptPlaceholder: 'Something unplanned',
    promptConfirm: 'Leave it',
    promptCancel: 'Not yet',
    leftBy: (name: string) => `${name} left this`,
    waitingCount: (n: number) =>
      n === 1 ? '1 Frame waiting' : `${n} Frames waiting`,
    createError: "That Frame didn't quite land. Try again?",
  },

  beatTypes: {
    travel: 'Travel',
    arrival: 'Arrival',
    activity: 'Activity',
    meal: 'A meal',
    rest: 'Rest',
    other: 'Something else',
  },

  frames: {
    eyebrow: 'The Story',
    // View toggle
    wall: 'Frame Wall',
    timeline: 'Timeline',
    // Empty states — masterfile §7
    emptyStory: 'Every story begins with a single Frame.',
    emptyChapter: 'This chapter is waiting for its first Frame.',
    looseFrames: 'Not yet placed',
    // Upload
    develop: 'Upload pictures',
    developing: 'Uploading\u2026',
    uploadingCount: (i: number, n: number) => `Uploading ${i} of ${n}\u2026`,
    videoTooLarge: 'Videos need to stay under 50MB. Trim it a little?',
    developed: 'Your Frame has found its place.',
    developError: "That Frame didn't quite land. Try again?",
    tooLarge: 'That file is too big, even compressed. Try a smaller one.',
    notAnImage: 'Frames are photographs. That file is something else.',
    // Caption
    captionPlaceholder: 'Say something about this one.',
    // Keepsake
    markKeepsake: 'Mark as The Keepsake',
    removeKeepsake: 'Remove as The Keepsake',
    keepsake: 'The Keepsake',
    keepsakeSet: 'Marked as The Keepsake.',
    // 1.2 — per-author Keepsakes (each of you keeps your own defining Frame)
    keepsakeOf: (name: string) => `${name}’s Keepsake`,
    markMyKeepsake: 'Make this my Keepsake',
    removeMyKeepsake: 'Remove my Keepsake',
    // Deletion — the exact copy from masterfile §7. Do not soften.
    removeFromStory: "Remove from this story? It'll stay exactly where it lives.",
    deleteForever:
      'This Frame will be gone for good \u2014 not just from this story, from everywhere. Are you sure?',
    confirmYes: 'Yes, let it go',
    confirmNo: 'Not yet',
    deleteAction: 'Delete this Frame',
    select: 'Select',
    selectDone: 'Done',
    chosen: (n: number) => (n === 1 ? '1 chosen' : `${n} chosen`),
    deleteSelected: (n: number) => (n === 1 ? 'Delete 1 Frame' : `Delete ${n} Frames`),
    deleteManyConfirm: (n: number) =>
      n === 1
        ? 'This Frame will be gone for good \u2014 from everywhere. Are you sure?'
        : `These ${n} Frames will be gone for good \u2014 not just from this story, from everywhere. Are you sure?`,
    deleteError: "That Frame couldn't be removed. Try again?",
    // Attribution
    developedBy: (name: string) => `${name} developed this`,
    waitingFor: (name: string) => `${name} left this, waiting`,
    toFrames: 'Read the story',
    // 1.2 — The Story feed (photo feed on the main album page)
    eyebrowTitle: 'The Story',
    lead: 'Everything, one Frame at a time.',
    tagline: 'Every Frame we developed, set by set.',
    uploadToSet: (label: string) => `Add to “${label}”`,
    details: 'Details',
    close: 'Close',
    developedOn: (date: string) => date,
    by: (name: string) => `By ${name}`,
    addCaption: 'Add a caption',
    removeCaption: 'Remove caption',
    saveCaption: 'Keep',
  },

  afterword: {
    eyebrow: 'The Afterword',
    title: 'The Afterword',
    sectionTitle: 'Written after.',
    tagline: 'Two authors, looking back. Answer what you want to; leave the rest.',
    lead: 'Written after, looking back. Answer what you want to. Leave the rest.',
    empty: 'Every story leaves something behind. Write yours.',
    // 1.2 — ratings
    ratePrompt: 'Tap to rate',
    rated: (n: number) => `${n} of 5`,
    // 1.2 — the Keepsake is its own upload now, not a picker
    uploadKeepsake: 'Upload The Keepsake',
    changeKeepsake: 'Choose a different one',
    keepsakeUploading: 'Keeping…',
    keepsakeCaption: 'This becomes The Keepsake — the defining image of the chapter.',
    // 1.2 — album interleave + word pair
    reflectionEyebrow: 'A reflection',
    wordPairEyebrow: 'In a word',
    carouselEyebrow: 'From the story',
    earlier: 'Earlier reflections',
    // Per-question
    yourAnswer: 'Your answer',
    theirAnswer: (name: string) => `${name}\u2019s answer`,
    unanswered: 'Unanswered',
    textPlaceholder: 'Take your time.',
    wordPlaceholder: 'One word.',
    pickFrame: 'Choose a Frame',
    changeFrame: 'Choose a different one',
    noFramesYet: 'No Frames yet \u2014 develop one first, and it can live here.',
    // Feedback
    saving: 'Keeping\u2026',
    saved: 'Your reflection is kept, signed and dated.',
    saveError: "That didn't save. Try again?",
    // Signature
    signedBy: (name: string, date: string) => `\u2014 ${name}, ${date}`,
    // Side-effects, said out loud so they aren't a surprise
    keepsakeNote: 'This Frame becomes The Keepsake.',
    themeNote: 'This word becomes the story\u2019s Theme.',
    toAfterword: 'Write the afterword',
  },

  print: {
    action: 'Develop this Fleeting Frames',
    hint: 'Use your browser\u2019s print dialog, then \u201cSave as PDF\u201d.',
    developed: 'Your Fleeting Frames has been developed.',
    back: 'Back to the story',
    afterwordHeading: 'The Afterword',
    chaptersHeading: 'The Chapters',
    colophon: 'Written one Frame at a time.',
  },

  errors: {
    title: 'Something came loose.',
    lead: 'Nothing was lost. Try once more.',
    retry: 'Try again',
  },

  // Validation + system messages surfaced to the reader. These render inside
  // role="alert", so they're as user-facing as anything else — they belong here,
  // not scattered through the actions.
  validation: {
    storyNeedsName: 'A story needs a name.',
    beatNeedsName: 'A Moment needs a name.',
    unknownBeatType: 'That kind of Moment does not exist.',
    waitingFrameNeedsPrompt: 'A Waiting Frame needs a prompt.',
    nameNeeded: 'A name is needed.',
    missingStory: 'Missing story.',
    noPhotograph: 'No photograph was attached.',
    notSignedIn: 'Not signed in.',
    generic: 'Something went wrong.',
    couldNotSave: 'Could not save.',
    couldNotCreateStory: 'Could not create the story.',
    couldNotAddBeat: 'Could not add the beat.',
  },

  notFound: {
    title: 'This page was never written.',
    lead: "Whatever you were looking for isn't in the library.",
  },

  nav: {
    signOut: 'Close the book for now',
    // 1.2 profile menu (upper-right on The Library)
    profileEyebrow: 'Signed in as',
    editProfile: 'Change your photo',
    profileUploading: 'Keeping…',
    jumpToShelf: 'The Library',
  },
} as const;

// The four sections of the 1.2 Afterword, in order, with their headings.
export const AFTERWORD_SECTIONS = [
  { key: 'keepsake', title: 'The Keepsake', blurb: 'The one Frame that best represents the story.' },
  { key: 'back', title: 'Looking Back', blurb: 'What happened — the events themselves.' },
  { key: 'within', title: 'Looking Within', blurb: 'Not the places. The people.' },
  { key: 'ahead', title: 'Looking Ahead', blurb: 'Something left for our future selves.' },
] as const;

// The 1.2 question bank every new story is seeded with. Section groups them;
// order here IS sort_order. Everything is optional to answer.
//   'frame'  (Keepsake) — an uploaded photograph becomes The Keepsake.
//   'word'   — one word becomes the story's Theme (if unset).
//   'rating' — a light 1–5 answer alongside the free-text ones.
// Editing this list only affects FUTURE stories (existing ones are backfilled
// idempotently — see ensureAfterwordBank).
export const DEFAULT_AFTERWORD_QUESTIONS: {
  section: 'keepsake' | 'back' | 'within' | 'ahead';
  question: string;
  answer_kind: 'text' | 'frame' | 'word' | 'rating';
}[] = [
  { section: 'keepsake', question: 'Which Frame tells this chapter best?', answer_kind: 'frame' },

  { section: 'back', question: 'What surprised you the most?', answer_kind: 'text' },
  { section: 'back', question: 'What made you laugh the hardest?', answer_kind: 'text' },
  { section: 'back', question: "What almost didn't happen?", answer_kind: 'text' },
  { section: 'back', question: 'What small moment became unexpectedly meaningful?', answer_kind: 'text' },
  { section: 'back', question: 'All told, how did this chapter feel?', answer_kind: 'rating' },

  { section: 'within', question: 'When did you feel closest to me?', answer_kind: 'text' },
  { section: 'within', question: 'What made this chapter feel like us?', answer_kind: 'text' },
  { section: 'within', question: "What's one thing you're grateful for from this chapter?", answer_kind: 'text' },
  { section: 'within', question: 'What is a moment no camera could have captured?', answer_kind: 'text' },

  { section: 'ahead', question: 'What should our future selves remember from today?', answer_kind: 'text' },
  { section: 'ahead', question: 'Years from now, what do you hope this chapter reminds you of?', answer_kind: 'text' },
  { section: 'ahead', question: "What's one tradition from this chapter you'd love to repeat?", answer_kind: 'text' },
  { section: 'ahead', question: 'What did this chapter feel like, in one word?', answer_kind: 'word' },
];

export type Copy = typeof copy;
