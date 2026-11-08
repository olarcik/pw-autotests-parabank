// Shared static test values: expected texts, URLs, amounts and fixed inputs

// Browser tab titles of ParaBank pages
export const PAGE_TITLES = {
  home: 'ParaBank | Welcome | Online Banking',
  register: 'ParaBank | Register for Free Online Account Access',
  customerCreated: 'ParaBank | Customer Created',
  accountsOverview: 'ParaBank | Accounts Overview',
  // Update Contact Info; the title stays the same after a successful update
  updateProfile: 'ParaBank | Update Profile',
  // Server error page, e.g. login.htm after a failed login
  error: 'ParaBank | Error',
};

// Expected page addresses, matched against the full URL
export const PAGE_URLS = {
  register: /register\.htm/,
};

// Expected href of links on the Home page. On the first visit the server appends
// ";jsessionid=..." to links, so only the start is matched
export const LINK_HREFS = {
  register: /^register\.htm/,
  forgotLoginInfo: /^lookup\.htm/,
};

// Register form validation messages; required-field errors are keyed by RegisterPage.requiredFields names
export const REGISTER_ERRORS = {
  required: {
    'First Name': 'First name is required.',
    'Last Name': 'Last name is required.',
    Address: 'Address is required.',
    City: 'City is required.',
    State: 'State is required.',
    'Zip Code': 'Zip Code is required.',
    SSN: 'Social Security Number is required.',
    Username: 'Username is required.',
    Password: 'Password is required.',
    Confirm: 'Password confirmation is required.',
  } as Record<string, string>,
  passwordsMismatch: 'Passwords did not match.',
};

// Login error messages
export const LOGIN_ERRORS = {
  // UI error page when the username, the password or both are empty
  empty: 'Please enter a username and password.',
  // UI error page for a wrong username or password
  invalid: 'The username and password could not be verified.',
  // REST GET /login/{username}/{password} body (400 text/plain) for any invalid credentials
  api: 'Invalid username and/or password',
};

// Account Services menu in the left panel of a logged-in customer, in display order
export const ACCOUNT_SERVICES = [
  'Open New Account',
  'Accounts Overview',
  'Transfer Funds',
  'Bill Pay',
  'Find Transactions',
  'Update Contact Info',
  'Request Loan',
  'Log Out',
];

// Account number as shown in the Accounts Overview table: digits only
export const ACCOUNT_NUMBER_PATTERN = /^\d+$/;

// Balance of the default account every new customer gets on registration
export const NEW_CUSTOMER_BALANCE = '$515.50';

// The same default account in REST JSON, where amounts are numbers (515.50 parses to 515.5)
export const NEW_CUSTOMER_ACCOUNT = { type: 'CHECKING', balance: 515.5 } as const;

// Password and confirmation that differ only in letter case
export const CASE_MISMATCHED_PASSWORDS = {
  password: 'Secret123',
  confirmPassword: 'secret123',
};

// REST error bodies (400 text/plain) of the customer endpoints
export const CUSTOMER_ERRORS = {
  notFound: (customerId: number | string) => `Could not find customer #${customerId}`,
};

// Body of POST /customers/update/{id} on success: plain text, although the content type is JSON
export const CUSTOMER_UPDATE_SUCCESS = 'Successfully updated customer profile';

// Update Contact Info validation messages (client-side), keyed by UpdateProfilePage.requiredFields names
export const UPDATE_PROFILE_ERRORS = {
  required: {
    'First Name': 'First name is required.',
    'Last Name': 'Last name is required.',
    Address: 'Address is required.',
    City: 'City is required.',
    State: 'State is required.',
    'Zip Code': 'Zip Code is required.',
  } as Record<string, string>,
};
