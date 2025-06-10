# NextN League Manager

## Description
A web application for managing sports leagues. It allows users to register teams, schedule matches, update scores, and view league standings.

## Features
- User authentication (Login/Register)
- Team registration and management
- Match scheduling and score updates
- League table/standings display
- Team performance summaries (potentially AI-powered, given 'genkit' and 'ai' folders)

## Technologies Used
- Next.js
- React
- TypeScript
- Tailwind CSS
- Firebase
- Genkit (Google AI)
- Shadcn/ui
- Zustand
- Zod

## Getting Started

### Prerequisites
- Node.js (LTS version recommended)
- npm or yarn (or pnpm, if `pnpm-lock.yaml` is present)
- Firebase account and a configured Firebase project (with Firestore and Authentication enabled)

### Installation
1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/your-repository-name.git
   cd your-repository-name
   ```
2. **Install dependencies:**
   Based on the `package-lock.json` file, this project uses npm.
   ```bash
   npm install
   ```
3. **Set up environment variables:**
   - Create a `.env.local` file in the root of the project.
   - Add your Firebase project configuration to this file. It should look something like this:
     ```
     NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_auth_domain"
     NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_storage_bucket"
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_messaging_sender_id"
     NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
     ```
   - You will also need to set up authentication for the Genkit AI features. Refer to the Genkit documentation for details on setting up Google AI authentication. This might involve setting `GOOGLE_API_KEY` or using service account credentials.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application should now be running on [http://localhost:9002](http://localhost:9002) (as per the `dev` script in `package.json`).

## Usage

Once the application is running, you can typically perform the following actions:

1.  **Register/Login:** Create a new account or log in with existing credentials to access the application's features.
2.  **Register Teams:** If you are an administrator or have the necessary permissions, navigate to the team management section to register new teams for the league.
3.  **Schedule Matches:** Access the schedule management area to add new matches, specifying the participating teams, date, and time.
4.  **Update Match Scores:** After a match has been played, update its score through the match interface.
5.  **View League Table:** Check the league standings, which should update automatically based on match results.
6.  **View Team Performance:** Explore individual team performance summaries, which may include AI-generated insights.

Refer to the application's UI for specific navigation and interaction details.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow these general guidelines:

1.  **Fork the repository.**
2.  **Create a new branch** for your feature or bug fix:
    ```bash
    git checkout -b feature/your-feature-name
    ```
    or
    ```bash
    git checkout -b fix/your-bug-fix-name
    ```
3.  **Make your changes** and ensure they follow the project's coding style.
4.  **Commit your changes** with a clear and descriptive commit message.
5.  **Push your changes** to your fork:
    ```bash
    git push origin feature/your-feature-name
    ```
6.  **Open a pull request** to the main repository, detailing the changes you've made.

Please ensure your code is well-tested and includes any necessary documentation updates.

## License

This project is licensed under the [Your License Name Here] - see the LICENSE.md file for details (if one exists).

It is common practice to include a `LICENSE.md` file in the root of your project. If you don't have one, you might consider adding one. The [MIT License](https://opensource.org/licenses/MIT) is a popular choice for open-source projects.
