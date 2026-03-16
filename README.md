# Focused

Focused is a mental health and self-reflection app built with Expo and React Native. The app is designed to give users a simple place to capture thoughts, track personal goals, and build a journaling habit in one focused experience.

## What the app does

- Save quick notes from the home screen for thoughts, reminders, or reflections.
- Set and manage personal wellness goals.
- Write and revisit journal entries.
- Use a clean mobile-first interface with local persistence.

## Core features

### Notes

The home screen lets users write short notes, save them instantly, and review them later. Notes are stored locally in SQLite and can be removed with swipe actions.

### Goals

Users can add wellness-oriented goals from a suggested list and keep track of active goals throughout the day.

### Journal entries

The journaling section supports creating and editing longer-form reflections so users can build a consistent mental health routine.

## Tech stack

- Expo
- React Native
- Expo Router
- TypeScript
- SQLite via Expo SQLite
- Drizzle ORM for local data access and migrations

## Project structure

```text
app/
  (tabs)/        Main app tabs: Home, Journal, Goals
components/      Shared UI components
constants/       Theme values and quotes
db/              Database schema
drizzle/         SQLite migrations
hooks/           Shared hooks
```

## Running the app locally

1. Install dependencies:

```bash
npm install
```

2. Start the Expo development server:

```bash
npm run start
```

3. Open the app in one of the supported targets:

- Android emulator
- iOS simulator
- Expo Go
- Web browser

You can also run platform-specific commands:

```bash
npm run android
npm run ios
npm run web
```

## Available scripts

- `npm run start` starts the Expo development server.
- `npm run android` opens the app on Android.
- `npm run ios` opens the app on iOS.
- `npm run web` runs the app in the browser.
- `npm run lint` runs the Expo lint configuration.

## Data model

Focused currently stores three main types of local data:

- Notes
- Goals
- Journal entries

These are defined with Drizzle schema files and persisted in a local SQLite database.

## Vision

Focused is meant to feel lightweight, calming, and practical. Instead of trying to be an all-in-one wellness platform, it centers on a few useful habits: capturing thoughts, setting intentions, and reflecting consistently.
