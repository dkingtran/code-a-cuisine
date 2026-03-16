# Code A Cuisine

**Code A Cuisine** is a smart recipe generator that turns your available ingredients into AI-powered recipe suggestions. Built for home cooks and flat-share residents who want to reduce food waste and cook more creatively.

## Features

- **Ingredient Input** — Add your ingredients with amount and unit (g, ml, piece) plus autocomplete suggestions
- **Preferences** — Choose cooking time (Quick / Medium / Complex), cuisine style (Italian, German, Japanese, Indian, Gourmet, Fusion) and diet (Vegetarian, Vegan, Keto, No Preferences)
- **AI Recipe Generation** — 3 unique recipes generated via n8n + Google Gemini
- **Recipe Library** — All generated recipes are stored in Firebase and browsable by cuisine
- **Real-time Likes** — Like recipes; count updates live across all devices via Firestore
- **Quota System** — 3 recipes per IP per day, 12 system-wide per day (enforced in both Angular and n8n)
- **Nutrition Info** — Calories, protein, fat and carbs per recipe
- **Responsive Design** — Works on desktop, tablet and smartphone

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 17+, TypeScript, SCSS |
| AI Workflow | n8n + Google Gemini |
| Database | Firebase Firestore |
| Hosting | (local dev via Angular CLI) |

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd code-a-cuisine
npm install
```

### 2. Configure Firebase

Copy the example environment file and fill in your Firebase credentials:

```bash
cp src/environments/environment.ts.example src/environments/environment.ts
cp src/environments/environment.prod.ts.example src/environments/environment.prod.ts
```

### 3. Configure n8n

- Import one of the `Code A Cuisine (*.json)` workflow files into your n8n instance
- Set your Google Gemini API key inside the AI Agent node
- The webhook URL must match the proxy config in `proxy.conf.json`

### 4. Start the development server

```bash
npm start
```

Open your browser at `http://localhost:4200/`.

## Project Structure

```
src/app/
├── core/services/        # Loading, Logger, Preferences, Theme
├── pages/                # Route-level components (home, generate, preferences, results, recipe-view, cookbook, cuisine-recipes, impressum)
├── shared/
│   ├── components/       # Header, Footer, RecipeCard, SvgIcon, LoadingOverlay
│   ├── models/           # Recipe & Cuisine TypeScript interfaces
│   └── services/         # Firebase, Recipe, Quota
└── app.routes.ts         # Lazy-loaded route definitions
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
