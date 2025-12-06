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

---

# Devlog Entry - November 30, 2025

## Physics Refinements and Timer System Implementation

Today we focused on improving the physics simulation, refining the game environment, implementing a timer system, and fixing automation issues.

### Physics Material System

Implemented a comprehensive physics material system to fix collision issues:

**Created Physics Materials:**
- **Ball Material**: Low friction (0.3), moderate bounce (0.3 restitution)
- **Wall Material**: High friction (0.8), minimal bounce (0.1 restitution)
- **Ground/Target Material**: Medium friction (0.5-0.6), no bounce (0.0 restitution)

**Contact Materials:**
- Configured specific interaction properties between different material pairs
- Ball vs Wall: Balanced friction and bounce for realistic collisions
- Ball vs Ground: Higher friction for better control
- Ball vs Target: Low bounce for stable landing detection

**Damping:**
- Added linear and angular damping (0.4) to all physics objects
- Reduces unwanted bouncing and jittery motion
- Creates more stable and predictable physics behavior

### Timer System and Scene Management

Implemented a 10-second timer system with automatic scene restart and exit:

**Timer Features:**
- **10-Second Countdown**: Timer starts when puzzle scene loads
- **Visual Timer Display**: Yellow progress bar at top of screen (turns red when < 3 seconds remaining)
- **Auto-Restart on Timeout**: If target not reached in 10 seconds, scene automatically restarts after showing failure message
- **Scene Exit on Success**: When puzzle is completed, scene exits after 2-second success display

**Scene Management:**
- Timer resets to 10 seconds when scene enters
- Ball position and physics state reset on scene restart
- Clean separation between scene lifecycle and game logic
- Foundation for F2 multi-scene requirements

### Platform Perimeter Protection

Calculated platform dimensions and added complete perimeter walls:
- **Platform**: 20×20 units (400 square units area)
- **Perimeter**: Walls positioned at edges (9.85 units from center) to prevent ball from falling off
- **Gap Management**: Added 4 small walls to cover gaps in north/south walls while maintaining a 2-unit path for gameplay

### Camera Improvements

Adjusted camera for better gameplay visibility:
- **Position**: Moved from (0, 5, 10) to (0, 15, 18) - further back and higher
- **Angle**: More top-down view while maintaining angled perspective
- **FOV**: Reduced from 75° to 60° for better focus on gameplay area

### Ramp Redesign

Reversed and repositioned the ramp for better gameplay flow:
- **Angle**: Changed from -0.2 to +0.3 radians (tilted upward toward target)
- **Position**: Lowered from Y=1.0 to Y=0.3 (sunk into floor)
- **Purpose**: Ball now rolls up the ramp and falls onto the target platform

### Development Workflow Improvements

**Removed Pre-commit Hooks:**
- Removed Husky and lint-staged due to PATH issues on Windows
- Switched to GitHub Actions-only approach for automation
- All checks now run in CI pipeline (more reliable across environments)

**GitHub Actions Fixes:**
- Added required permissions (`id-token: write`, `pages: write`) for GitHub Pages deployment
- Fixed test script to use ES modules (changed from `.js` to `.mjs`)
- Updated test to use keyboard inputs instead of mouse interactions
- Screenshots saved as artifacts for 7 days

### Code Quality

- Improved TypeScript type safety (removed `any` types)
- Better separation of concerns in physics and rendering systems
- Cleaner codebase after removing unused joystick controller
- Added timer state management and UI integration

### Current State

The game now features:
- ✅ Realistic physics with proper material interactions
- ✅ Complete perimeter protection (ball can't fall off platform)
- ✅ Improved camera view for better gameplay visibility
- ✅ Refined ramp mechanics for better puzzle flow
- ✅ 10-second timer with automatic restart and scene exit
- ✅ Visual timer display with color-coded urgency feedback
- ✅ Reliable CI/CD pipeline with automated testing
- ✅ All F1 requirements fully satisfied
- ✅ **2D top-down RoomScene with 9 interconnected rooms**
- ✅ **A* pathfinding system for intelligent navigation**
- ✅ **Enhanced player character model with body and head**
- ✅ **Seamless scene transitions between 2D room view and 3D puzzle view**
- ✅ **Context-aware UI (instructions hidden in room scene)**
- ✅ **Corridor system connecting rooms with doorways**
- ✅ **Player spawns in non-puzzle room, requiring navigation to puzzle**

### F2 Requirements Implementation - Room Scene and Navigation

In preparation for F2 requirements, we've implemented a comprehensive 2D top-down adventure scene system:

**Room Scene Architecture:**
- **9-Room Grid Layout**: Created a 3×3 grid of interconnected rooms with proper floor, wall, and corridor systems
- **Visual Room Design**: Each room features distinct flooring (gray for normal rooms, light green for puzzle room), walls with doorways, and connecting corridors
- **Puzzle Room Integration**: Center room (Room 5) contains a red glowing puzzle indicator that transitions to the 3D physics puzzle scene

**Pathfinding System:**
- **A* Pathfinding Algorithm**: Implemented a grid-based A* pathfinding system for intelligent navigation
- **Grid-Based Movement**: Player movement respects walls and navigates through doorways and corridors automatically
- **Smooth Path Following**: Player character smoothly follows calculated paths to clicked destinations

**Player Character Improvements:**
- **Enhanced Character Model**: Replaced simple cylinder with a more detailed character model featuring:
  - Cylindrical body (blue)
  - Spherical head (skin-toned)
  - Proper positioning and rotation
- **Spawn Point**: Player now spawns in Room 1 (top-left) instead of the puzzle room, requiring navigation to reach the puzzle

**Scene Management Enhancements:**
- **Seamless Scene Transitions**: Clicking the puzzle indicator in Room 5 transitions to the 3D PuzzleScene
- **Automatic Return**: Completing the puzzle automatically returns the player to the RoomScene
- **UI Context Awareness**: Physics puzzle instructions are hidden in RoomScene and only appear when entering PuzzleScene
- **Camera System**: Proper camera switching between orthographic (2D room view) and perspective (3D puzzle view)

**Visual Polish:**
- **Corridor System**: Added visible corridors connecting adjacent rooms with distinct flooring
- **Wall Doorways**: Walls feature doorways for realistic room connections
- **Improved Lighting**: Enhanced ambient and directional lighting for better room visibility

### Next Steps

- Implement object interaction system for F2 requirements
- Add inventory system for carrying objects between scenes
- Create additional interactive objects in rooms
- Implement game ending conditions

---

# Devlog Entry - December 4, 2025

## F3 Requirements Implementation

Today we completed implementation of multiple F3 requirements, bringing our game to a fully playable state that satisfies the F3 milestone.

## Selected Requirements

We selected the following F3 requirements to implement:

1. **[unlimited undo]**: We chose this requirement because it represents an interesting technical challenge in state management and provides significant value to players. Implementing unlimited undo requires careful tracking of game state and designing a system that can reverse any major action without breaking game consistency. This requirement also aligns well with our existing scene management and inventory systems, making it a natural extension of our architecture.

2. **[save system]**: We selected the save system requirement because it's essential for a complete game experience and was a logical next step after implementing our scene management and inventory systems. The requirement for multiple save slots and auto-save ensures players never lose progress, which is critical for a point-and-click adventure game where players may need to experiment with different approaches.

3. **[visual themes]**: We chose visual themes because it enhances the game's polish and accessibility. Implementing light and dark modes that respond to system preferences demonstrates attention to user experience and allows players to play comfortably in different lighting conditions. The requirement to integrate themes deeply into the game (day/night lighting of rooms) also provides an opportunity to create a more immersive atmosphere.

4. **[touchscreen]**: We selected touchscreen support because it significantly expands the game's accessibility and playability on mobile devices. Since our game is built as a web application, adding touchscreen-only gameplay ensures that players can enjoy the full experience on smartphones and tablets without requiring external peripherals. This requirement also complements our existing keyboard and mouse controls, making the game truly cross-platform.

## How We Satisfied the Software Requirements

### Unlimited Undo

We implemented an unlimited undo system (`UndoSystem.ts`) that tracks and can reverse all major play actions. The system maintains an unlimited stack of actions, where each action stores complete state information needed for reversal. We identified three major action types: scene transitions (moving between RoomScene and PuzzleScene), object interactions (picking up items), and player movements (click-to-move navigation). Each action type has its own data structure that captures the necessary state: `SceneTransitionData` stores previous and new scene names plus player position, `ObjectInteractionData` stores object data and inventory state before the action, and `PlayerMovementData` stores from/to positions. The undo system integrates seamlessly with our existing systems: `SceneManager` automatically records scene transitions, `RoomScene` records object interactions and player movements, and the `Game` class provides a keyboard shortcut (Ctrl+Z / Cmd+Z) for undo with visual feedback. When undoing, the system restores complete state: scene transitions restore the previous scene and player position, object interactions restore objects to the scene and inventory to its previous state, and player movements restore the player's position. The system handles edge cases like preventing undo during game ending states, clearing undo history when loading saves, and properly recreating objects with all their original properties. This satisfies the requirement for unlimited levels of undo of major play actions, excluding physics interactions within the puzzle scene as specified.

### Save System

We implemented a comprehensive save system (`SaveSystem.ts`) that supports multiple save slots (three manual save slots) and an auto-save feature. The save system uses browser localStorage to persist game state, including inventory items, game progress, player position, current scene, and removed interactable objects. The auto-save feature automatically saves the game when significant events occur (inventory changes, scene transitions, puzzle completion), ensuring players never lose progress by accidentally closing the game. Manual save slots allow players to create named save points at different stages of the game. The save system integrates with our `GameStateManager` to capture and restore complete game state, including puzzle completion status, items collected, and player position in the room scene. When loading a save, the system restores all game state: inventory is repopulated, removed objects are tracked, the player is moved to the saved position, and the correct scene is loaded. The system also provides UI (`SaveLoadUI.ts`) for managing saves, showing save timestamps, and confirming save/load operations. This fully satisfies the requirement for multiple save points and auto-save functionality.

### Visual Themes

We implemented a visual theme system (`ThemeManager.ts`) that supports light and dark modes that automatically respond to the user's system preferences (detected via `prefers-color-scheme` media query). The theme system deeply integrates into the game's display: in light mode, rooms have bright, sunny lighting with lighter floor and wall colors, while dark mode features dim, moonlit lighting with darker room colors. The lighting system (ambient and directional lights) changes color and intensity based on the theme, creating a day/night atmosphere in the fictional rooms. The theme also affects UI elements through CSS variables, changing background colors, text colors, and accent colors. The system listens for system preference changes in real-time, automatically updating the game's visual style when the user changes their OS or browser theme preference. This satisfies the requirement for light and dark modes that respond to host environment preferences and are deeply integrated into the game's display, not just window borders.

### Touchscreen Support

We implemented comprehensive touchscreen support (`TouchController.ts` and touch event handlers in `RoomScene.ts`) that enables full gameplay without requiring mouse or keyboard input. In the `RoomScene`, we added touch event listeners (`touchstart`, `touchend`) that work alongside existing mouse click handlers, allowing players to tap anywhere on the screen to move their character or interact with objects. Touch events use the same interaction logic as mouse clicks, ensuring consistent behavior across input methods. For the `PuzzleScene`, we created a virtual joystick system that appears at the touch location when the player touches the screen. The joystick consists of a base circle and a movable stick that the player can drag to control the ball's direction. The stick movement is constrained to the joystick radius, and the force applied to the ball is proportional to the stick's position relative to the center. The joystick automatically hides when the touch ends, providing a clean interface. All touch events prevent default browser behavior (scrolling, zooming) to ensure smooth gameplay. The touch controller works simultaneously with keyboard controls, allowing players to use either input method seamlessly. This fully satisfies the requirement for touchscreen-only gameplay with no dependency on mouse or keyboard.

## Reflection

Looking back on how we achieved the F3 requirements, our team's approach evolved significantly from our initial planning. Initially, we focused primarily on the unlimited undo system as it seemed like the most technically interesting challenge. However, as we implemented it, we realized that the save system and visual themes were natural complements that would significantly improve the player experience. The save system, in particular, became more important than we initially anticipated because it works hand-in-hand with the undo system—players can save their progress and also undo actions, giving them multiple ways to recover from mistakes.

Our implementation approach also changed as we worked. We initially planned to implement each requirement in isolation, but we discovered that these systems benefit greatly from integration. For example, the undo system needed to work with the save system to prevent cross-session undo issues, and the theme system needed to update both the 3D scene lighting and the 2D room scene simultaneously. This led us to create a more cohesive architecture where systems communicate through well-defined interfaces.

One key learning was the importance of state management. Implementing unlimited undo required us to think carefully about what constitutes "game state" and how to capture it efficiently. We learned that not all state needs to be captured—only the state that changes as a result of player actions. This insight helped us design a lightweight undo system that doesn't impact performance.

The visual themes requirement turned out to be more complex than expected because it required changes to both Three.js lighting systems and CSS styling. We learned the value of having a centralized theme manager that coordinates changes across multiple systems, which is a pattern we'll likely reuse in future features.

The touchscreen requirement was the most recent addition and required us to think carefully about input abstraction. We realized that our existing input handling was tightly coupled to specific input devices, so we refactored the interaction system to use a unified coordinate-based approach. This allowed us to support both mouse clicks and touch taps with the same underlying logic. The virtual joystick for the puzzle scene was particularly interesting because it required creating a custom UI element that works seamlessly with the game's rendering system. We learned that touch input requires more careful event handling to prevent unwanted browser behaviors like scrolling and zooming.

Overall, the F3 requirements pushed us to think more holistically about the game architecture and player experience, leading to a more polished and user-friendly game than we initially planned. The combination of undo, save system, visual themes, and touchscreen support creates a comprehensive, accessible game that works well across different devices and user preferences.

---

## Repository Link

The complete project with all devlog entries can be found at:
**https://github.com/rv-us/cmpm121-final.git**


