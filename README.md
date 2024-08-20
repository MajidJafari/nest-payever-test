1. POST /api/users

On the request store the user entry in db. After the creation, send an email and rabbit event. Both can be dummy sending (no consumer needed).

2. GET /api/user/{userId}

Retrieves data from https://reqres.in/api/users/{userId} and returns a user in JSON representation.

3. GET /api/user/{userId}/avatar

Retrieves image by 'avatar' URL.

On the first request it should save the image as a plain file, stored as a mongodb entry with userId and hash. Return its base64-encoded representation.

On following requests should return the previously saved file in base64-encoded. representation (retrieve from db).

4. DELETE /api/user/{userId}/avatar

Removes the file from the FileSystem storage.

Removes the stored entry from db.

Further Improvements:
- Use bcrypt for hash operation in high load production for processing the requests faster
- Use i18n and Crowdin platforms to separate the text contents from feature implementation
- Containerization of the external services of MongoDB and RabbitMQ
- Use Redis for storing the rate-limit request information
- Add some build tools like GitHub actions and add lint, test, qualify, and build as stages for it
- Use Streaming for downloading and storing avatars