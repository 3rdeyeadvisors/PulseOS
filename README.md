# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Mobile App Submission (App Store & Play Store)

This project is configured for iOS and Android using Capacitor.

### Prerequisites

1.  **RevenueCat**: Update `src/lib/config.ts` with your actual API keys.
2.  **App Identifiers**: The app is currently set to `tech.pulseos.app`.
3.  **Assets**: Icons and splash screens are generated in `assets/`.

### Deployment Steps

#### 1. Build the Web Project
```sh
npm run build
```

#### 2. Sync with Native Platforms
```sh
npx cap sync
```

#### 3. iOS (App Store)
- Open the project in Xcode: `npx cap open ios`
- Set your development team.
- Ensure `PrivacyInfo.xcprivacy` is included in the target.
- Archive and upload to App Store Connect.

#### 4. Android (Play Store)
- Open the project in Android Studio: `npx cap open android`
- Generate a signed bundle (AAB): `Build > Generate Signed Bundle / APK`.
- Upload the AAB to the Google Play Console.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
