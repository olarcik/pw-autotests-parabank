export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface User {
  firstName: string;
  lastName: string;
  address: Address;
  phoneNumber: string;
  ssn: string;
  username: string;
  password: string;
}
