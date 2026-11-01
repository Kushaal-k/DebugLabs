# DebugLabs
Full Stack Debugging Simulator is a hands-on learning platform where users investigate and fix bugs in existing repositories.

Use Node.js 24 and npm 11. Run installation commands from the repository root;
the root `package-lock.json` covers all four npm workspaces.

```sh
npm ci
npm run dev
```

Development starts the API at `http://127.0.0.1:3001`, the execution engine at
`http://127.0.0.1:3002`, and Vite at the address printed in its output. `npm start`
is an alias for this development command. Both backend services expose `/health`;
the execution engine currently provides only this health endpoint.

```sh
npm run build      # Build shared first, then both services and the frontend
npm run typecheck  # Check every workspace
npm run lint       # Run configured workspace linters (currently the frontend)
npm test           # Build and smoke-test the compiled backend services
npm run check      # Run lint, typechecks, build, and service smoke tests
```

The service tests use temporary ports and stop their child processes afterward.
Frontend verification currently consists of linting, strict typechecking, and a
production build; browser interaction tests have not been added yet.

The shared package emits JavaScript and type declarations to `shared/dist`.
The root development, build, typecheck, and test commands build it before its
consumers. When working on shared types, rebuild it with
`npm run build --workspace=@debugLabs/shared` after changes.

To run a compiled backend after `npm run build`:

```sh
npm run start --workspace=server
npm run start --workspace=execution-engine
```

Each backend accepts `HOST` and `PORT` environment variables. The frontend build
is in `web/dist`; `npm run preview --workspace=web` previews it locally.
