/**
 * Labels 
 */
export default {
  app: {
    name: 'Quality Inspection Tracker',
    fullName: 'Quality Inspection Tracker',
    tagline: 'Shop-floor quality inspections',
    description: 'Log, track and resolve shop-floor quality defects',
  },

  common: {
    logout: 'Logout',
    loading: 'Loading…',
    saving: 'Saving…',
    cancel: 'Cancel',
    apply: 'Apply',
    clearAll: 'Clear all',
    all: 'All',
    optional: '(optional)',
    required: '(required)',
    offlineNote: 'Offline - showing last synced data.',
  },

  nav: {
    inspections: 'Inspections',
    logDefect: 'Log Defect',
    summary: 'Summary',
  },

  login: {
    username: 'Username',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in…',
    demoHint: '',
    errorOffline: 'No connection - logging in needs to reach the server once.',
    errorInvalid: 'Invalid username or password.',
  },

  list: {
    title: 'Inspections',
    filterSort: 'Filter & sort',
    emptyTitle: 'No inspections found.',
    emptyFiltered: 'Try clearing some filters.',
    emptyNoData: 'Tap “Log Defect” below to record the first one.',
  },

  card: {
    resolve: 'Resolve',
    resolvedPrefix: 'Resolved:',
    waitingToSync: '⏳ Waiting to sync',
    sap: 'SAP',
  },

  form: {
    title: 'Log defect',
    date: 'Inspection date',
    machineId: 'Machine / line ID',
    machinePlaceholder: 'e.g. LOOM-14',
    defectType: 'Defect type',
    customDefectType: 'Custom defect type',
    customDefectPlaceholder: 'Describe the defect',
    severity: 'Severity',
    remarks: 'Remarks',
    remarksPlaceholder: 'Anything worth noting…',
    save: 'Save inspection',
    savedToast: 'Inspection logged',
    queuedToast: 'Offline - saved locally, will sync automatically',
    requiredField: 'This field is required',
  },

  resolve: {
    title: 'Resolve inspection',
    noteLabel: 'Resolution note',
    notePlaceholder: 'What was done to fix it?',
    offlineError: "You're offline - resolving requires a connection.",
    markResolved: 'Mark Resolved',
    successToast: 'Inspection resolved',
  },

  filters: {
    title: 'Filter & sort',
    status: 'Status',
    severity: 'Severity',
    dateRange: 'Date range',
    from: 'From',
    to: 'To',
    sortBy: 'Sort by',
    newestFirst: 'Newest first',
    oldestFirst: 'Oldest first',
    bySeverity: 'Severity',
  },

  summary: {
    title: 'Summary',
    severity: 'Severity',
    total: 'Total',
  },

  sync: {
    offline: 'Offline',
    toSync: '{count} to sync',
    syncedOne: 'Synced 1 offline inspection',
    syncedMany: 'Synced {count} offline inspections',
    rejected: 'A queued entry was rejected by the server and removed',
  },

  severity: {
    Critical: 'Critical',
    Major: 'Major',
    Minor: 'Minor',
  },

  status: {
    Open: 'Open',
    Resolved: 'Resolved',
  },

  defectTypes: {
    'Weave Defect': 'Weave Defect',
    'Shade Variation': 'Shade Variation',
    'Hole/Tear': 'Hole/Tear',
    'Count Deviation': 'Count Deviation',
    Other: 'Other',
  },
}
