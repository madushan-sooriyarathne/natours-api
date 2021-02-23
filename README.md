API Endpoint Documentation

Base URL: `/api/v1/`

---

### Auth Routes

#### POST `/auth/register` - Register New users

Create new user and send back a **201** response with created user & a auth token

Required Body Parameters

-     username - *string*
-     name - *string*
-     email - *string*
-     password - *string*
-     confirmPassword - *string*

#### POST `/auth/login` - Login a existing user

Create new user and send back a **202** response with a auth token

Required Body Parameters

-     email - *string*
-     password - *string*

#### POST `/auth/forgot-password` - Get a password reset email

Send a password reset email to the given email if a user with that email exists in the database.

Required Body Parameters

-     email - *string*

#### POST `/auth/reset-password?reset={RESET_TOKEN}` - Reset the password

Reset the password if the password reset token in query string is valid.

Required Body Parameters

-     newPassword - *string*
-     confirmNewPassword - *string*

#### POST `/auth/update-password` - Update the password

Update the current password.
**_User must be logged in to preform this action_**

Required Body Parameters

-     previousPassword - *string*
-     newPassword - *string*
-     confirmNewPassword - *string*

#### POST `/auth/delete-user` - Update the password

Delete the user from the system
**_User must be logged in to preform this action_**

Required Body Parameters

-     passowrd - *string*

---

### User Routes

#### GET `/users` - Get all users in the system as an array

Query all users in the database and send as the response.
**_only an ADMIN can preform this action_**

#### GET `/account` - Get the user data of Logged in user

Send the user data of current user / logged in user
**_User must be logged in to preform this action_**

#### POST `/user/update-user` - Update the details of current user

Update the user details such as* name, username* & _email._ cannot use this to update the passowords
**_User must be logged in to preform this action_**

---

### Tour Routes

#### GET `/tours` - Get all Tours

Query all tours except secretTours in the database and send as a array in the response.
This route also accept limit, sort,page & fields main query parameters and tour properties as comparison parameters

#### GET `/tours/{TOUR_ID}` - Get one specific Tour with Tour Id

Query a tour with given id and send in the response.

#### GET `/tours/best-5-budget-tours` - Get highest rated budget tours

Order by ratingsAverage and price. Query first 5 tours and send as a response to the client

#### POST `/tours` - add New Tour

Add a new tour to the system
**_only an ADMIN can preform this action_**

Required Body Parameters

-     name - *string*
-     difficulty - *string* (easy | medium | hard)
-     duration - *number* (Tour duration in number of days)
-     maxGroupSize - *number*
-     price - *number*
-     summery - *string*
-     imageCover - *string*

#### PATCH `/tours/{TOUR_ID}` - update a specific tour

Updates a existing tour with given new data after the data is validated.
**_only an ADMIN can preform this action_**

#### PUT `/tours/{TOUR_ID}` - change a specific tour

Change a specific tour to a new tour (All data requires to create a new tour must be provided for this route as well)
**_only an ADMIN can preform this action_**

Required Body Parameters

-     name - *string*
-     difficulty - *string* (easy | medium | hard)
-     duration - *number* (Tour duration in number of days)
-     maxGroupSize - *number*
-     price - *number*
-     summery - *string*
-     imageCover - *string*

#### DELETE `/tours/{TOUR_ID}` - Delete a tour

Delete a specific tour from the system.
**_only an ADMIN can preform this action_**

---

### Tour Review Routes

#### GET `/tours/{TOUR_ID}/reviews` - Get all Reviews for a specific tour

Query all reviews for specific tour and send as a array in the response.

#### POST `/tours/{TOUR_ID}/reviews` - add New Tour

Add a new review for specific tour
**_only an USER can preform this action_**

Required Body Parameters

-     title - *string*
-     rating - *number*

#### PATCH `/tours/{TOUR_ID}/reviews/{REVIEW_ID}` - Update a review in a specific tour

Update a review in a specific tour with given data in request body. Once tour is updated send the it in the response.
**_only an USER can preform this action_**

#### DELETE `/tours/{TOUR_ID}/reviews/{REVIEW_ID}` - Delete a review in a specific tour

**_only an USER can preform this action_**
