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

Our team plans to use generative AI tools selectively and transparently. We will allow the use of autocomplete features in tools like **GitHub Copilot** for code suggestions, but we will establish clear guidelines about when and how AI-generated code should be reviewed and understood by team members before integration. We will not use agentic AI modes that make direct modifications to our codebase without human review. Any significant AI assistance will be documented in our development process. The goal is to use AI as a productivity tool while ensuring all team members understand and can maintain the codebase.

## Outlook

Our team hopes to accomplish a project that demonstrates a deep understanding of 3D graphics and physics by implementing these systems from scratch on the web platform. We aim to create something that showcases both technical competence and creative design, potentially exploring unique gameplay mechanics that leverage our custom implementations.

We anticipate that the hardest part of the project will be implementing performant 3D rendering and physics systems without the abstractions provided by existing game engines. Managing the complexity of WebGL shaders, matrix transformations, and collision detection will require careful planning and iterative development. Additionally, coordinating between our custom engine implementation and game design will be challenging, as we'll need to balance feature development with engine capabilities.

By approaching this project with the web browser platform and implementing our own rendering and physics systems, we hope to gain a deeper understanding of how game engines work under the hood. We expect to learn about graphics programming, linear algebra applications in game development, performance optimization techniques, and the trade-offs involved in building versus using existing tools. This hands-on approach should provide valuable insights into both the technical and design aspects of game development.

