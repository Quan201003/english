# Google login setup

1. Create a Firebase project and add a Web app.
2. Enable Google under **Authentication > Sign-in method**.
3. Create a Firestore database.
4. Copy the Web app configuration into `anki-static/firebase-config.js`, replacing `null` with the configuration object.
5. Add the app's domain under **Authentication > Settings > Authorized domains**.
6. Deploy the rules in `firestore.rules`.

Progress is stored at `users/{uid}`. The rules allow a signed-in user to read and write only their own document. Without Firebase configuration, the app remains usable as a guest and stores guest progress in browser `localStorage`.
