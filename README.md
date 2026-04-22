# Prompt Architect

Prompt Architect is a specialized tool designed to help developers and architects generate structured, high-fidelity JSON prompts for Large Language Models (LLMs). By providing a formal specification of a system's context, requirements, UI, data model, and behavior, Prompt Architect ensures that LLMs have all the necessary information to generate accurate boilerplate code, system designs, or technical documentation.

## User Interface Overview

The interface is divided into two main panels:
1.  **Form Panel (Left):** A series of collapsible sections where you define the system specification.
2.  **Preview Panel (Right):** A real-time JSON preview of the generated prompt, which can be copied directly to your clipboard.

### Key Features
-   **Real-time Sync:** Every change in the form is immediately reflected in the JSON preview.
-   **Section Toggles:** Every section can be enabled or disabled. Disabling a section sets its value to `null` in the JSON, allowing you to omit irrelevant parts of the specification.
-   **Dynamic Lists:** Add and remove items (technologies, requirements, test cases, etc.) with ease.
-   **Copy to Clipboard:** One-click copying of the entire JSON structure.

---

## How to Use

1.  **Define Context:** Start by naming your project and defining the AI's role (e.g., "Senior React Architect").
2.  **Specify Requirements:** List the technologies to use and core requirements the system must ensure.
3.  **Design the UI:** Define the theme, layout, and specific UI elements (buttons, forms, etc.) and their data bindings.
4.  **Model Data:** Describe the storage type and define your data collections or tables.
5.  **Define Logic:** List state changes, validation rules, and edge cases.
6.  **Quality Control:** Add test cases and error handling strategies.
7.  **Contracts:** (Optional) Enable TypeSpec to define formal API or data contracts.
8.  **Configure Output:** Specify what artifacts you want the LLM to generate (e.g., "React Components", "Unit Tests").
9.  **Copy & Prompt:** Copy the generated JSON and paste it into your LLM of choice (Gemini, ChatGPT, etc.) as a system instruction or part of your prompt.

---

## Section Details & JSON Mapping

### 1. Project Context
-   **Purpose:** Sets the high-level goals and technical assumptions.
-   **JSON Node:** `context`
-   **Fields:**
    -   `project`: Project name.
    -   `description`: Core functionality and goals.
    -   `agent_role`: The persona the AI should adopt.
    -   `assume`: Technical environment (OS, Browser, Framework).

### 2. Requirements
-   **Purpose:** Explicit constraints and technology choices.
-   **JSON Node:** `requirements`
-   **Fields:**
    -   `use`: List of technologies/libraries.
    -   `ensure`: Core requirements to satisfy.
    -   `separate`: (Internal) Logic for separation of concerns.

### 3. UI & Styling
-   **Purpose:** Defines the visual and structural aspects of the frontend.
-   **JSON Node:** `ui_spec`
-   **Fields:**
    -   `theme`: Color scheme (Light, Dark, etc.).
    -   `layout`: Structural pattern (Vertical, Grid, Bento, etc.).
    -   `elements`: Array of UI components with `type`, `title`, and `bind_to` (data binding) fields.

### 4. Data & Backend
-   **Purpose:** Describes the data persistence layer.
-   **JSON Node:** `data_spec`
-   **Fields:**
    -   `storage`: Object containing `type` (e.g., "Firebase", "Convex") and `collections` (array of name/schema pairs).

### 5. Behavior & Logic
-   **Purpose:** Defines how the application reacts to events.
-   **JSON Node:** `behavior`
-   **Fields:**
    -   `state_changes`: Triggers and their results.
    -   `validation`: Rules for data integrity.
    -   `edge_cases`: Handling of empty states or unusual inputs.

### 6. Testing & Quality
-   **Purpose:** Ensures reliability and performance.
-   **JSON Node:** `testing`
-   **Fields:**
    -   `test_cases`: Specific scenarios to verify.
    -   `error_handling`: Strategies for failure recovery.

### 7. Contracts
-   **Purpose:** Formal API or data definitions.
-   **JSON Node:** `contracts`
-   **Fields:**
    -   `typespec`: A string containing TypeSpec definitions, or `null` if disabled.

### 8. Output Configuration
-   **Purpose:** Tells the LLM exactly what to produce.
-   **JSON Node:** `generate`
-   **Fields:**
    -   `artifacts`: List of desired outputs (Code, Docs, etc.).
    -   `explanation`: Boolean to toggle step-by-step reasoning.

---

## JSON Structure for LLM Consumption

The output is a single JSON object. LLMs should treat this as a **Technical Specification Document**. When provided with this JSON, the LLM should:
1.  Respect the `agent_role` for the tone and depth of the response.
2.  Use the `assume` and `requirements.use` fields to select the correct syntax and libraries.
3.  Implement the `ui_spec` elements using the specified `layout` and `theme`.
4.  Follow the `behavior` and `validation` rules strictly.
5.  Generate the requested `artifacts` as the primary output.

---

## Technical Stack
-   **Frontend:** React 19, TypeScript
-   **Styling:** Tailwind CSS
-   **Animations:** Motion (framer-motion)
-   **Icons:** Lucide React
