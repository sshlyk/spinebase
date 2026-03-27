# Project Plan: SpineBase Dynamic Explorer (v2.4)

## 1. Core Architecture
A single-page, mobile-first web application acting as a dynamic browser for a spine measurement database. This version utilizes a **Full-Manifest Headless CMS** approach: the `structure.json` file is the single source of truth for both hierarchy and item availability. All resource fetching is performed using **relative paths**.

## 2. Data Sources & Relative Path Strategy
The app assumes a co-located file structure where the HTML, JSON, and resource folders live in the same root directory.

* **`index.html` (The Shell):** Contains the persistent UI (Sticky Header, Breadcrumbs, Main Container) and the CSS framework. It acts as the entry point and imports `app.js`.
* **`app.js` (The Engine):** Contains all JavaScript logic, including the Manifest loader, state management (Category > Modality > Grid), and the Regex-based asset rewriter.
* **`about.html` (Standalone Content):** A dedicated HTML file for the "About Us" section. This allows for rich text and image editing without modifying the core application code.

* **Manifest (Local):**
    * **Path:** `./structure.json` (must be in the same folder as `index.html`).
    * **Role:** Defines the navigation hierarchy and provides the `path` and `content` array for each modality.
* **Asset Construction:**
    * **Logic:** `Path_from_Manifest` + `Folder_Name_from_Content` + `/index.html`.
* **Asset Normalization:**
    * A Regex engine scans loaded sub-documents to rewrite `src="images/..."` to root-relative paths, ensuring clinical images load correctly regardless of folder depth.

## 3. Local Development & Security
Modern browsers block `fetch()` requests when files are opened directly via the `file://` protocol. A local web server is required.

**To run the app on your laptop:**
1. Open your terminal and `cd` to the project folder.
2. Start the server: `python3 -m http.server 8000`
3. Access the app at: [http://localhost:8000/](http://localhost:8000/)

## 4. UI/UX & Layout Logic
* **Sticky Navigation:**
    * The Header (Brand + Breadcrumbs) is locked to `position: sticky; top: 0;`. 
    * **Constraint:** Ancestor elements (html/body) must NOT have `overflow-x: hidden` or `height: 100%` as these properties break sticky positioning in modern browser engines.
    * **Visuals:** Uses a frosted glass effect (`backdrop-filter`) to maintain legibility when content scrolls underneath.
* **Clinical Reading Mode:**
    * When a document is opened, the app toggles a `.clinical-mode` class on the body. This removes background textures and center-alignments to provide a high-contrast, edge-to-edge reading experience.
* **Scroll Reset Protocol:**
    * To ensure documents display from the beginning, the app triggers a triple-reset on every "Content" state change:
        1. `window.scrollTo(0,0)`
        2. `document.body.scrollTop = 0`
        3. `document.documentElement.scrollTop = 0`

## 5. Navigation & History
* **State Management:** Uses a `stateStack` array to track navigation depth (Category > Modality > Item).
* **Browser Integration:** Uses the **HTML5 History API** (`pushState` and `popstate`). This allows the hardware "Back" button on Android/iOS and the browser's back button to function exactly like the in-app "Back" button.

## 6. Folder Hierarchy Requirements
* **Structure:** The physical folder paths must strictly match the `path` strings in `structure.json`.
* **Items:** Every entry in the `content` array must have a corresponding subfolder.
* **Leaf Content:** Each subfolder must contain an `index.html` (the measurement content) and a `thumbnail.png` (the preview card).

## 7. Development Milestones
1.  **Shell Implementation:** Setup the sticky header and the responsive `main` container.
2.  **Manifest Processing:** Build the logic to convert JSON paths into relative filesystem links.
3.  **Dynamic Rendering:** Implement the menu lists and the thumbnail grid.
4.  **Content Injection:** Finalize the Regex asset-rewriter and the triple-point scroll reset.
5.  **Clinical Styling:** Add the CSS transitions for background-removal when viewing documents.
