// One theme file keeps every screen consistent. Screens use these names, never raw numbers.
// The colours match the Finishline web app.
export const colors = {
  primary: '#fb5d3b', // orange: the one main action on a screen
  primaryPressed: '#e04b2a',
  onPrimary: '#ffffff',
  ink: '#121211', // text
  muted: '#737068', // secondary text
  paper: '#f4f2ed', // screen background
  card: '#ffffff',
  line: '#d8d5cd',
  lime: '#d9f25b', // AI label and "exact fit"
  error: '#b3261e',
  errorBackground: '#fdecea',
  success: '#2e7d32'
};

// The only four gap sizes. No 13, no 15.
export const spacing = { xs: 4, sm: 8, md: 16, lg: 24 };

export const radius = { md: 12, full: 999 };

// Smallest tap size: Apple asks 44 points, Google 48 dp. One number, used by every button.
export const touchTarget = 48;

export const font = { small: 13, body: 15, title: 20, hero: 28 };

// Cards: the four shadow props for iPhone, elevation for Android.
export const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 6,
  elevation: 2
};
