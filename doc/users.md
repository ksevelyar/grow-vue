# Users
## Requirements
* Registration requires an email address, handle, password, and time zone.
* Sign-in requires an email address and password.
* Registration and sign-in are available without a session.
* Other pages require a session.
* Network and server errors do not trigger a sign-in redirect.

## User scenarios
### 1. A user registers
1. Open the registration page.
2. Enter an email address, handle, password, and time zone.
3. Register and verify the login page opens.

### 2. A user signs in
1. Open the login page.
2. Enter an email address and password.
3. Sign in and verify the grow-log list opens.

### 3. A user accesses sign-in without a session
1. Open the login page without a session.
2. Verify the login page appears.

### 4. A user accesses registration without a session
1. Open the registration page without a session.
2. Verify the registration page appears.

### 5. An unauthenticated user is redirected to sign in
1. Open a protected page without a session.
2. Verify the login page opens.
