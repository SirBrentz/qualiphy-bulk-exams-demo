/* Bulk Exam Actions demo: data. Public share build: names, ticket keys and code references removed. Fake data only. */
(function () {
  'use strict';
  const D = {};

  D.ACCOUNT = { you: 'You (Admin)', name: 'Mock Wellness Clinic' };

  /* service: 'both' = GFE and Rx agreements signed; 'gfe' = GFE only, so Rx exams are greyed out, as today. */
  D.CLINICS = [
    { name: 'Mock Wellness Clinic', service: 'both', state: 'California' },
    { name: 'Mock Wellness Clinic - Santa Monica', service: 'both', state: 'California' },
    { name: 'Mock Wellness Clinic - Pasadena', service: 'gfe', state: 'California' },
  ];

  /* tpl: 'q' = Qualiphy template, 'c' = custom template. rx: an Rx exam. last: days since last sent (null = never). */
  D.EXAMS = [
    { id: 4501, title: 'GLP-1 Weight Loss Exam (Semaglutide)', price: 45, q: 18, rx: true, tpl: 'q', active: true, last: 1 },
    { id: 4502, title: 'GLP-1 Weight Loss Exam (Tirzepatide)', price: 45, q: 18, rx: true, tpl: 'q', active: true, last: 2 },
    { id: 4503, title: 'IV Therapy Good Faith Exam', price: 35, q: 12, rx: false, tpl: 'q', active: true, last: 0 },
    { id: 4504, title: 'Botox & Filler Good Faith Exam', price: 35, q: 14, rx: false, tpl: 'q', active: true, last: 3 },
    { id: 4505, title: 'GLP-1 Weight Loss Follow-Up', price: 30, q: 9, rx: true, tpl: 'q', active: true, last: 6 },
    { id: 4506, title: 'NAD+ Injection Good Faith Exam', price: 35, q: 11, rx: false, tpl: 'q', active: true, last: 21 },
    { id: 4507, title: 'Vitamin B12 Injection Good Faith Exam', price: 25, q: 8, rx: false, tpl: 'q', active: true, last: 44 },
    { id: 4508, title: 'Microneedling Good Faith Exam', price: 35, q: 10, rx: false, tpl: 'q', active: true, last: 96 },
    { id: 4509, title: 'Chemical Peel Good Faith Exam', price: 35, q: 10, rx: false, tpl: 'q', active: false, last: 210 },
    { id: 4510, title: 'Laser Hair Removal Good Faith Exam', price: 35, q: 12, rx: false, tpl: 'q', active: true, last: 130 },
    { id: 4511, title: 'PRP Hair Restoration Good Faith Exam', price: 35, q: 13, rx: false, tpl: 'q', active: true, last: null },
    { id: 4512, title: 'Testosterone Therapy Exam', price: 55, q: 20, rx: true, tpl: 'q', active: true, last: 180 },
    { id: 4513, title: 'Sermorelin Peptide Exam', price: 45, q: 16, rx: true, tpl: 'q', active: true, last: null },
    { id: 4514, title: 'Hair Loss (Finasteride) Exam', price: 40, q: 12, rx: true, tpl: 'q', active: true, last: 75 },
    { id: 4515, title: 'Erectile Dysfunction Exam', price: 40, q: 12, rx: true, tpl: 'q', active: true, last: null },
    { id: 4516, title: 'Tretinoin Skin Care Exam', price: 35, q: 10, rx: true, tpl: 'q', active: true, last: 140 },
    { id: 4517, title: 'IV Therapy Follow-Up Good Faith Exam', price: 25, q: 6, rx: false, tpl: 'q', active: true, last: 9 },
    { id: 4518, title: 'Kybella Good Faith Exam', price: 35, q: 11, rx: false, tpl: 'q', active: true, last: 260 },
    { id: 4519, title: 'Sclerotherapy Good Faith Exam', price: 35, q: 12, rx: false, tpl: 'q', active: false, last: 330 },
    { id: 4520, title: 'Hormone Pellet Therapy Exam', price: 55, q: 19, rx: true, tpl: 'q', active: true, last: null },
    { id: 9101, title: 'New Client Wellness Intake', price: 35, q: 15, rx: false, tpl: 'c', active: true, last: 4 },
    { id: 9102, title: 'IV Hydration Menu Screening', price: 30, q: 12, rx: false, tpl: 'c', active: true, last: 15 },
    { id: 9103, title: 'Weight Loss Monthly Check-In', price: 30, q: 8, rx: true, tpl: 'c', active: true, last: 12 },
    { id: 9104, title: 'Holiday Glow Package Exam', price: 35, q: 10, rx: false, tpl: 'c', active: false, last: 280 },
  ];

  /* Seeded change history: the three exams that start deactivated, turned off one at a time from the row menu. */
  D.HISTORY = [
    { daysAgo: 14, how: 'row', action: 'off', ids: [4519] },
    { daysAgo: 31, how: 'row', action: 'off', ids: [9104] },
    { daysAgo: 58, how: 'row', action: 'off', ids: [4509] },
  ];

  D.COPY = {
    deactivateTip: 'This will remove the ability for you to send this exam out from the dropdown menu in send exam invite. This will remove access across all your locations, and for managers as well. You can re-activate it at anytime.',
    tabs: { q: 'Qualiphy Templates', c: 'Custom Templates' },
    lists: { q: 'Qualiphy Templates List', c: 'Custom Templates List' },
    recentDays: 30,
    undoSeconds: 10,
  };

  /* ---------------------------------------------------------------- CONTEXT (public share build)
     Same structure as the private CONTEXT block in v1/data.js, with ticket keys, colleague and client
     names, and code references removed. Edit both when the plan changes. */
  D.CTX = {
    title: 'Bulk exam deactivation',
    status: 'An idea, ready to size. Proposed as a small win for the current sprint.',
    kicker: 'Clinic portal idea',
    walk: {
      asked: 'Clinics with long exam lists asked for exactly this through the Success team, and leadership has asked for it too.',
      owner: 'Sized for one portal engineer, with the header rename in the same change.',
    },
    ref: {},
    problem: [
      'A clinic Admin turns exams off one at a time: row menu, Deactivate Exam, a toast, then the whole list reloads. Accounts with long exam lists repeat that dozens of times.',
      'Enterprise clients asked, through the Success team, for checkboxes and a bulk deactivate button. Leadership filed the same ask earlier ("edit button on exams tab, they should be able to toggle").',
      'Nothing tells the Admin what a deactivation touches: every location on the account, managers, and the exam list that integrations read.',
      'Today\'s "Active Exam" column prints a raw status value, and the ID column is headed "OG Id".',
    ],
    proposal: [
      'A checkbox on every row of both tabs, and one in the header that selects every row in the current view.',
      'Search by exam ID or title, and filter by status and type, so a bulk change starts from the right list.',
      'A bulk bar with the count and Deactivate or Activate, then one confirm dialog that spells out the impact.',
      'One request for the whole change, the table updating in place, Undo in the toast, and a history of who changed what.',
    ],
    requirements: [
      { id: 'R1', text: 'Checkbox on every row in Qualiphy Templates and Custom Templates. The header checkbox selects every selectable row in the current view.', pass: 'Greyed-out rows (exams this location cannot send) cannot be selected, same as today\'s disabled row menu.' },
      { id: 'R2', text: 'Search by exam ID or title. Filter by status (Active, Deactivated) and type (Good Faith Exam, Rx). Show the count.', pass: 'Filtering keeps the selection, and the bulk bar says how many selected exams are outside the view.' },
      { id: 'R3', text: 'A bulk bar appears with the selection: the count, Deactivate (n), Activate (n) and Clear.', pass: 'Each button acts only on the selected exams it applies to.' },
      { id: 'R4', text: 'Deactivate asks once, listing the exams and the impact: every location, managers, the integrations exam list, patients already mid-exam.', pass: 'It warns when selected exams were sent in the last 30 days (with a one-click "leave them out") and when every exam would end up deactivated.' },
      { id: 'R5', text: 'One request applies the change to every selected exam, all or nothing.', pass: 'The table updates in place without a full reload, and the selection clears.' },
      { id: 'R6', text: 'Undo in the success toast for 10 seconds.', pass: 'Undo restores exactly the previous state of those exams.' },
      { id: 'R7', text: 'Every change is recorded: who, when, which exams, bulk or single.', pass: 'Shown under the table as Recent changes.' },
      { id: 'R8', text: 'The status column reads Active or Deactivated, and the ID column reads Exam ID.', pass: 'No raw status values in the table. The header rename ships in the same change.' },
    ],
    size: 'Small. Frontend: checkbox column, toolbar, bulk bar, confirm dialog, undo and the history card. Backend: one bulk endpoint on the existing hide records, plus a who and when record. Rough guess for sizing: 3 to 4 dev days with tests.',
    fit: [
      { area: 'Roles and permissions', verdict: 'fits', how: 'The roles plan already lists "Bulk deactivate exams" and "Hide specific exams from the send list" as permissions.', action: 'Admin only for now (managers have no Exams tab today). The permission gates it once roles ship.' },
      { area: 'Quidget and API endpoints', verdict: 'watch', how: 'A deactivated exam leaves the API exam list that the Quidget, website plugins and EMRs read. An invite that names it by ID still goes through.', action: 'The confirm dialog says so. Keep invite behaviour unchanged (Q3).' },
      { area: 'API change feed', verdict: 'watch', how: 'Hides live outside the exam record, so a deactivation never changes the exam\'s updated time. Incremental pulls miss it.', action: 'Carry visibility changes in the change feed when it is built (Q7).' },
      { area: 'Hidden exams reappearing after an edit', verdict: 'prereq', how: 'A reported bug. The server now copies an exam\'s hides to its new version when an edit creates one, which looks like the fix.', action: 'Confirm it is fixed and close it, because bulk hides depend on it.' },
      { area: 'Exams table header', verdict: 'fits', how: 'Same table: "OG Id" should read "Exam ID".', action: 'Ship it in the same change.' },
      { area: 'Async conversion (one exam either way)', verdict: 'fits', how: 'Retiring today\'s separate async copies later leaves clinics with duplicate exams to turn off.', action: 'Bulk deactivation is how they will clean up. Nothing to change now.' },
      { area: 'Clinic setup wizard', verdict: 'fits', how: 'The wizard turns exams on by service at signup. This is the day-two counterpart.', action: 'Use the same words (Activate, Deactivate) and the same account-wide rule.' },
      { area: 'Launch readiness', verdict: 'fits', how: '"Exam no longer included?" questions land on Support today with no trail.', action: 'The change history answers who turned an exam off, and when.' },
      { area: 'Website plugin alerts', verdict: 'watch', how: 'Research is under way on alerting clinics when an exam disappears. A clinic\'s own bulk deactivation looks the same to the plugin.', action: 'Coordinate, so the alert can say the clinic turned it off.' },
      { area: 'Credit controls', verdict: 'fits', how: 'Credit controls can pause Rx exams automatically when charges fail. A deactivation is the clinic\'s own choice.', action: 'Keep them visibly different: the Rx lock shows on the invite, Deactivated shows on the Exams tab.' },
    ],
    decisions: [
      { id: 'Q1', who: 'Product, with Success', q: 'Account-wide or per location?', def: 'Account-wide, as today.', why: 'Today\'s hide is stored per account, so an account with three locations hides the exam at all three. Per location needs a schema change and a location-aware invite picker. Worth asking Success whether the clients who asked need per-location menus.', alt: 'Per location, later.' },
      { id: 'Q2', who: 'Product', q: 'Who can bulk deactivate?', def: 'The account Admin only, until roles ship.', why: 'Managers have no Exams tab today. The roles plan already has a "Bulk deactivate exams" permission to open it up later.', alt: 'Managers too, now.' },
      { id: 'Q3', who: 'Product and Engineering', q: 'Should a deactivated exam also block invites that name it (API, Quidget, EMR)?', def: 'No. Keep today\'s behaviour: deactivating only hides the exam from lists.', why: 'Blocking would break live website and EMR mappings the moment a clinic tidies its list.', alt: 'Block API invites too.' },
      { id: 'Q4', who: 'Product, with Engineering', q: 'Show "Last sent" and warn about recently sent exams?', def: 'Yes.', why: 'An Admin cannot tell which exams are safe to turn off. It needs a per-account count of recent sends; Engineering to confirm it is cheap.', alt: 'Later.' },
      { id: 'Q5', who: 'Engineering', q: 'One bulk request, all or nothing?', def: 'Yes: one endpoint that takes a list of exam IDs, applied in one transaction and safe to repeat.', why: 'Looping today\'s single endpoint means N requests, partial failures and N list reloads.', alt: 'Loop the single endpoint.' },
      { id: 'Q6', who: 'Engineering', q: 'Record who and when for every change?', def: 'Yes.', why: 'Today only the account and a date are kept, and turning an exam back on deletes even that, so the trail disappears.', alt: 'No history.' },
      { id: 'Q7', who: 'Engineering', q: 'Include deactivations in the planned API change feed?', def: 'Yes.', why: 'Integrations that pull only what changed never see a deactivation today.', alt: 'Leave integrations to full pulls.' },
    ],
    engNotes: [
      'Today a deactivation is one record per account and exam: no location and no user. Turning the exam back on deletes the record.',
      'The portal\'s exam picker and the API exam list both leave hidden exams out.',
      'The invite checks deliberately still accept a hidden exam, so integrations that send it by ID keep working.',
      'When an edit creates a new exam version, its hides are copied across.',
      'The table prints the raw status value today, and every row action reloads the whole list.',
      'Suggested: one bulk endpoint taking a list of exam IDs and the target state, applied in one transaction and safe to repeat, returning the updated rows, plus an audit record per change (user, action, exam IDs, time).',
    ],
    integrations: [
      'Deactivated exams drop out of the exam list the API returns, which the Quidget, website plugins and EMR integrations read.',
      'An invite that names a deactivated exam by ID still goes through, so live integrations keep working.',
      'Patients who already received the exam can finish it.',
      'A deactivation does not change the exam\'s updated time, so integrations that pull only what changed miss it until a change feed carries it.',
    ],
    about: {
      real: 'The Exams tab layout, columns and row menus, today\'s Deactivate Exam tooltip, the account-wide rule, and what lists and invites do with a deactivated exam.',
      made: 'The account, locations, exams, prices, "Last sent" values and history.',
      notBuilt: 'Add, View, Edit and Delete for custom exams, the rest of Invite Patient, and anything outside the Exams tab.',
    },
  };

  window.BULK_DEMO = D;
})();
