// Shared static test values: expected texts, amounts and fixed inputs

// Browser tab titles of ParaBank pages
export const PAGE_TITLES = {
  home: 'ParaBank | Welcome | Online Banking',
  register: 'ParaBank | Register for Free Online Account Access',
  customerCreated: 'ParaBank | Customer Created',
  accountsOverview: 'ParaBank | Accounts Overview',
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

// Balance of the default account every new customer gets on registration
export const NEW_CUSTOMER_BALANCE = '$515.50';

// Password and confirmation that differ only in letter case
export const CASE_MISMATCHED_PASSWORDS = {
  password: 'Secret123',
  confirmPassword: 'secret123',
};
