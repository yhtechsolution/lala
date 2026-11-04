# Lala Guesthouse Platform

Lala is a guesthouse discovery app made up of two parts: a web admin portal and a mobile app for customers. Admins use the portal to add and manage guesthouse listings. Customers use the mobile app to browse, search, save favourites and rate guesthouses. There is no booking or payment in the app. Customers contact the guesthouse directly.

## What each part does

The admin portal (web) lets admins log in, register guesthouses with their photos, amenities, location, price and contact details, and manage those listings later. It also has a dashboard with some numbers about the listings, a communications hub for sending messages, and an analytics  page.

The customer app (mobile) lets anyone browse and search guesthouses without an account. Once you sign up and log in you can favourite guesthouses and leave ratings.

## Team

* Larona Mokgosi (24019730)
* Simba Dabutha (24019857)
* Ephraim Ross (24020100)
* Thuo Malope (24019366)
* Amasha Nkwae (24019709)
* Thabiso Kolojane (24019741)
* Thabo Lesole (24019949)
* Mutsawashe Maraidza (24020134)

## Tech stack

* Web: React with TypeScript, built with Vite
* Mobile: React Native with Expo
* Backend: Firebase (Authentication, Firestore and Storage), shared by both apps
* GitHub for version control and Figma for the designs

We used Firebase so we didn't have to build and host our own server. Both apps share the same database and the same login system.

## Folder layout

```text
lala-guesthouse-platform/
  web/       the admin portal
  mobile/    the customer app
  docs/      documentation and the entity diagram
  README.md
```

## Getting started

You need Node.js and npm installed. To run the mobile app you also need the Expo Go app on your phone, or an Android/iOS emulator.

Clone the repo:

```bash
git clone https://github.com/Aston-Villa-JAVA/lala-guesthouse-platform.git
cd lala-guesthouse-platform
```

Install the packages for each app:

```bash
cd web
npm install
cd ../mobile
npm install
```

### Firebase settings

Both apps need our Firebase keys in a `.env` file. The `.env` files are gitignored, so please never commit them.

For the web app, create `web/.env`. There is a `web/.env.example` you can copy from. It needs these variables:

```text
VITE_FIREBASE_API_KEY = Firebase web API key
VITE_FIREBASE_AUTH_DOMAIN = Firebase Auth domain
VITE_FIREBASE_PROJECT_ID = Firebase project ID
VITE_FIREBASE_STORAGE_BUCKET = Firebase Storage bucket
VITE_FIREBASE_MESSAGING_SENDER_ID = Firebase messaging sender ID
VITE_FIREBASE_APP_ID = Firebase web app ID
```

For the mobile app, create `mobile/.env` with the same six values, but start each name with `EXPO_PUBLIC_` instead of `VITE_` (for example `EXPO_PUBLIC_FIREBASE_API_KEY`). Expo only reads variables that start with that prefix.

There is also a `mobile/.env.example` you can copy from.

You can find the values in the Firebase Console under Project settings, then General, then Your apps.

If you are marking this project, please use your own Firebase project or the credentials the group will send you separately. We have not put any keys in the repository.

### Setting up your Firebase project

The apps use Email/Password sign-in only, so make sure that is switched on under Authentication in the Firebase Console. Google sign-in is not needed.

The first admin has to be created by hand, because only an existing admin can create other admins:

1. In the Firebase Console go to Authentication, then Users, then Add user.
2. Copy the new user's UID.
3. In Firestore, create a document at `admins/<that UID>` with the fields `email`, `displayName`, `createdAt` and `createdBy` (set `createdBy` to `bootstrap`).

After that, admins can create more admins from the web portal.

There is no sample data yet. Until the registration form is built you can add two or three test guesthouses by hand in the Firestore console.

### Running the apps

Web:

```bash
cd web
npm run dev
```

Mobile (in a second terminal):

```bash
cd mobile
npx expo start
```

Then scan the QR code with Expo Go.

## Data model

The entity diagram is in the `docs` folder. `docs/entity-diagram.md` shows up as a diagram when you open it on GitHub, and the [Lala Entity Diagram PDF]https://drive.google.com/file/d/18EnSkovBZmHRMfn6rK6JcSyqom4eo6Bj/view?usp=drivesdk is available on Google Drive.


## Scope

The app covers listing management, discovery, search, filtering, favourites and ratings. It does not cover booking, payments, messaging between users or availability calendars.

The communications hub and the analytics dashboard were not in the first write-up. They came in later from the Figma designs, and we cover them in the scope amendment (`Lala_Scope_Amendment.docx`).

## Contributions

Who did what is in the commit history on GitHub. A contribution log is in `CONTRIBUTIONS.md`.

## Demo

Demo video link: to be added.

## Demo Video and QA Testing

[Demo Video and QA Testing](https://drive.google.com/file/d/1Q7J0F-Hgid7TO1tdk7pFqrJFilaAqK4F/view?usp=drive_link)

See also: [docs/demo-video-and-qa-testing.md](docs/demo-video-and-qa-testing.md)
