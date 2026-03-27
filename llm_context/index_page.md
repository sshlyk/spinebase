# Project Plan: SpineBase Dynamic Explorer (v2.5)

## 1. Core Architecture
A single-page, mobile-first web application acting as a dynamic browser for a spine measurement database. This version utilizes a **Full-Manifest Headless CMS** approach: the `structure.json` file is the single source of truth for both hierarchy and item availability. All resource fetching is performed using **relative paths**.

## 2. Data Sources & Relative Path Strategy
The app assumes a co-located file structure where the HTML, JSON, and resource folders live in the same root directory.

* **`index.html` (The Shell):** Contains the persistent UI (Sticky Header, Breadcrumbs, Main Container, Search Bar) and the CSS framework. It acts as the entry point and imports `app.js`.
* **`app.js` (The Engine):** Contains all JavaScript logic, including the Manifest loader, state management (Category > Modality > Grid), asset rewriter, and the search engine.
* **`about.html` (Standalone Content):** A dedicated HTML file for the "About Us" section.
* **Manifest (Local):** `./structure.json`. Defines the navigation hierarchy and lists available documents.

## 3. Local Development & Security
Modern browsers block `fetch()` requests when files are opened directly via the `file://` protocol. A local web server is required.
1. Open terminal and `cd` to the project folder.
2. Start server: `python3 -m http.server 8000`
3. Access at: [http://localhost:8000/](http://localhost:8000/)

## 4. UI/UX & Layout Logic
* **Sticky Navigation:** The Header (Brand + Search + Breadcrumbs) is locked to `position: sticky; top: 0;`.
* **Clinical Reading Mode:** Toggles a `.clinical-mode` class on the body to remove background textures for edge-to-edge reading.
* **Scroll Reset Protocol:** Ensures documents display from the beginning by triggering a triple-reset on content changes.

## 5. Navigation & History
* **State Management:** Uses a `stateStack` array to track navigation depth.
* **Browser Integration:** Uses the **HTML5 History API** (`pushState` and `popstate`) to ensure native "Back" button compatibility.

## 6. Folder Hierarchy Requirements
* **Structure:** Physical folder paths must match `structure.json`.
* **Leaf Content:** Subfolders must contain `index.html` and `thumbnail.png`.

## 7. Search Functionality (Fuzzy Match)
* **Index Generation:** On initialization, the app flattens the `structure.json` tree into a searchable array of objects containing document names, categories, and paths.
* **Fuzzy Matching Logic:** A dynamic Regex engine takes the user's input and injects `.*?` between characters (e.g., "cva" matches "Cervical Angle"), allowing for highly typo-tolerant, non-sequential keystroke matching.
* **State Injection:** Clicking a search result automatically injects the parent `category` and `modality` into the `stateStack` before loading the document, ensuring that pressing the "Back" button correctly drops the user onto the relevant thumbnail grid.

## 8. Development Milestones
1.  **Shell Implementation:** Setup the sticky header, responsive container, and search input.
2.  **Manifest & Indexing:** Convert JSON into relative filesystem links and build the flat search array.
3.  **Dynamic Rendering:** Implement menu lists and thumbnail grids.
4.  **Search Logic:** Implement fuzzy matching Regex and UI dropdown population.
5.  **Content Injection:** Finalize document fetching, Regex asset-rewriting, and history sync.
