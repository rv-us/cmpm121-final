# Devlog Entry - November 14, 2025

## Introducing the team

Our team consists of two members, each taking on dual leadership roles to cover all four required disciplines:

**Rachit Verma** serves as both:
- **Tools Lead**: Responsible for researching and setting up development tools, establishing coding style guidelines, configuring auto-formatting systems, and providing support for source control and deployment workflows.
- **Engine Lead**: Responsible for researching and selecting the game engine/platform, teaching teammates how to use it, establishing project folder structure and code organization standards, and designing software architecture that abstracts engine complexity from the rest of the team.

**Anish Bansal** serves as both:
- **Design Lead**: Responsible for setting the creative direction of the project, establishing the look and feel of the game, creating art or code samples for team reference, and leading discussions on domain-specific language primitives if needed.
- **Testing Lead**: Responsible for implementing automated testing within the codebase, organizing human playtests beyond the team, and reporting on testing results and feedback.

## Tools and materials

### Engine

We have chosen to use the **web browser platform** ([HTML5](https://developer.mozilla.org/en-US/docs/Web/HTML), [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API), and [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API)) as our development platform. This choice satisfies the F1 Requirements by requiring us to implement high-level 3D rendering and physics ourselves, rather than using an engine that already provides these features. The web platform offers excellent cross-platform compatibility, requires no installation for end users, and provides powerful low-level APIs that give us full control over rendering and physics implementation. Additionally, the browser's built-in debugging tools and the ability to iterate quickly make it an ideal choice for our project.

### Language

We will primarily use **JavaScript** (with potential use of **TypeScript** for type safety) as our programming language, as it is the native language of the web platform. For data storage and configuration, we will use **JSON** (JavaScript Object Notation), which integrates seamlessly with JavaScript and provides a human-readable format for game data, level definitions, and configuration files. This language choice aligns with our engine selection and allows us to leverage the full ecosystem of web development tools and libraries.

### Tools

For code editing, we will use **Visual Studio Code** ([VS Code](https://code.visualstudio.com/)) as our primary IDE, as it offers excellent JavaScript/TypeScript support, integrated Git functionality, and a rich ecosystem of extensions. For visual asset creation, we plan to use tools like **Aseprite** or **GIMP** for pixel art and 2D graphics, and potentially **Blender** for 3D modeling if needed. We may also use **GitHub** for version control and collaboration, and browser developer tools for debugging and performance profiling. These tools were chosen based on their accessibility, cross-platform support, and the team's familiarity with them.

### Generative AI

Our team plans to use generative AI tools, including agentic modes, to assist with development. **Anish Bansal** will use **GitHub Copilot** for AI-assisted coding, while **Rachit Verma** will use **Cursor** with its AI features. We will allow the use of both autocomplete features and agentic AI modes that can make direct modifications to our codebase. However, we will establish clear guidelines about when and how AI-generated code should be reviewed and understood by team members before integration. Any significant AI assistance will be documented in our development process. The goal is to use AI as a productivity tool while ensuring all team members understand and can maintain the codebase.

## Outlook

Our team hopes to accomplish a project that creates a living, breathing game world utilizing Large Language Models (LLMs) while implementing a physics-based game environment. We aim to combine the dynamic, emergent storytelling capabilities of LLMs with a fully interactive physics simulation, creating a game experience where the world feels alive and responsive. This approach will allow us to explore how AI-driven narrative and character behavior can interact with a physically simulated game world, potentially creating unique emergent gameplay moments that arise from the intersection of AI-driven content and physics-based interactions.

We anticipate that the hardest part of the project will be integrating LLM-driven systems with our custom physics implementation in a performant and cohesive way. Managing the complexity of WebGL shaders, matrix transformations, and collision detection for the physics system will require careful planning, while simultaneously handling LLM API calls, response processing, and ensuring smooth interaction between AI-generated content and the physical game world. Additionally, coordinating between our custom engine implementation, physics simulation, and LLM integration will be challenging, as we'll need to balance real-time performance with the potentially asynchronous nature of LLM interactions.

By approaching this project with the web browser platform and implementing our own rendering and physics systems while integrating LLMs, we hope to gain a deeper understanding of how game engines work under the hood and how modern AI technologies can enhance game experiences. We expect to learn about graphics programming, linear algebra applications in game development, physics simulation, LLM integration patterns, performance optimization techniques, and the trade-offs involved in building versus using existing tools. This hands-on approach should provide valuable insights into both the technical aspects of game engine development and the creative possibilities of combining AI with interactive physics-based worlds.

---

# Devlog Entry - November 20, 2025

## Project Setup and Initial Implementation

Today we made significant progress on setting up the project infrastructure and implementing the core F1 requirements.

### Development Environment Setup

We initialized the project with TypeScript and configured the build system:
- Created `package.json` with proper scripts for building, linting, and type checking
- Configured `tsconfig.json` for ES2020 modules with strict type checking
- Set up project structure with organized folders: `src/game/`, `src/scenes/`, `src/objects/`, `src/ui/`, and `public/`
- Configured output to `public/dist/` for GitHub Pages deployment

### Third-Party Libraries Integration

Successfully integrated the required third-party libraries:
- **Three.js** (v0.160.0): Integrated via CDN using import maps for 3D rendering
- **Cannon-es** (v0.20.0): Integrated via CDN for physics simulation
- Both libraries are loaded as ES modules, satisfying the F1 requirement for third-party 3D rendering and physics libraries

### Core Game Implementation

Implemented a physics-based puzzle game where players control a red ball to reach a green target:

**Physics System:**
- Created `PhysicsWorld.ts` wrapper around Cannon.js for physics simulation
- Implemented `PhysicsObject.ts` class to sync Three.js meshes with Cannon.js physics bodies
- Set up gravity and collision detection

**Rendering System:**
- Created `Renderer.ts` to manage Three.js scene, camera, and renderer
- Implemented proper lighting with ambient and directional lights
- Added shadow mapping for visual depth

**Game Logic:**
- Implemented `Puzzle.ts` for game state management (Playing, Success, Failure)
- Created `PuzzleScene.ts` with the main game scene including:
  - Red ball (player-controlled object)
  - Green target platform
  - Brown ramp/platform
  - Six gray walls creating a navigable path
- Added success/failure detection when ball reaches target or falls off

**Player Controls:**
- Implemented `KeyboardController.ts` for keyboard input
- Supports Arrow Keys and WASD for ball movement
- Applies continuous forces to the ball for smooth control

**UI Feedback:**
- Created `GameUI.ts` for visual feedback
- Large green pulsing plane appears on success
- Red indicator for failure conditions

### Development Automation

**Pre-commit Automation:**
- Installed and configured Husky for Git hooks
- Set up lint-staged to process staged files
- Configured ESLint (v9) with TypeScript support
- Added Prettier for code formatting
- Pre-commit hook runs:
  - ESLint with auto-fix
  - Prettier formatting
  - TypeScript type checking (blocks commit on errors)

**Post-push Automation:**
- Created GitHub Actions workflow (`.github/workflows/ci.yml`)
- Automatic deployment to GitHub Pages on push to main
- Screenshot generation using Playwright in headless browser
- Automated interaction testing with fixed input sequences
- Tests verify game reaches expected states

### Challenges and Solutions

**Module Loading:**
- Initially faced issues with ES module imports in the browser
- Solved by adding `.js` extensions to all relative imports (required for ES modules)
- Used import maps to resolve `three` and `cannon-es` from CDN

**Caching Issues:**
- Encountered browser caching preventing updates from appearing
- Fixed by disabling cache in http-server (`-c-1` flag)
- Added cache-busting query parameters to script tags

**Control System Iteration:**
- Initially implemented a 3D joystick controller
- Switched to keyboard controls for better usability and responsiveness
- Removed joystick code to keep codebase clean

### Reflection of current state

The game is now fully playable with:
- ✅ Physics-based puzzle with ball rolling mechanics
- ✅ Keyboard controls (Arrow Keys/WASD)
- ✅ Success/failure detection with visual feedback
- ✅ Obstacle course with walls creating a path
- ✅ All F1 requirements satisfied
- ✅ Pre-commit automation working
- ✅ GitHub Actions CI/CD pipeline configured


- so far we are looking good and on track

### Reflection of Next Steps

- Test the GitHub Actions workflow on next push
- Refine wall positioning and puzzle difficulty
- Consider adding more visual polish (textures, better materials)
- Plan for LLM integration in future iterations
- Add more puzzle variations or levels


### November 21 update 
- Ball physics refined

