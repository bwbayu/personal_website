// devicon ships no type declarations for its bundled stylesheet, so a bare
// `import "devicon/devicon.min.css"` triggers TS2882 under moduleResolution: "bundler".
// This ambient declaration tells TypeScript the side-effect CSS import is valid.
// (Next.js/webpack handles the actual bundling at build time.)
declare module "devicon/devicon.min.css";
