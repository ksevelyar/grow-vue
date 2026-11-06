# Users
## Requirements
* A user can register with an email address, handle, password, and time zone.
* `/register` is accessible without an authenticated session.
* A user can sign in with an email address and password.
* `/login` is accessible without an authenticated session.
* Every page except `/login` and `/register` requires an authenticated session.
* An unauthenticated user is redirected to `/login` only when the current-session endpoint responds with 401.
* Network and other server errors from the current-session endpoint do not trigger a login redirect.

## User scenarios
### 1. User can register
1. The user opens the registration page.
2. The user enters an email address, handle, password, and time zone.
3. The user registers and is redirected to the login page.

### 2. User can sign in
1. The user opens the login page.
2. The user enters an email address and password.
3. The user signs in and sees the grow-log list.

### 3. Unauthenticated user is redirected to sign in
1. The user opens a protected page without an authenticated session.
2. The user is redirected to the login page.
