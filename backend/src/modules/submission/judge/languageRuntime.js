/**
 * Maps each supported language to its Docker image and the exact shell
 * commands to compile (if needed) and run a submission. Mirrors
 * LanguageRuntime.java — build these images with
 * `npm run build-judge-images` (see src/docker/) before running the judge.
 */
const RUNTIMES = {
  JAVA: {
    dockerImage: 'codearena/java',
    sourceFileName: 'Main.java',
    compileCommand: 'javac Main.java',
    runCommand: 'java -Xmx%dm Main',
  },
  PYTHON: {
    dockerImage: 'codearena/python',
    sourceFileName: 'main.py',
    compileCommand: null,
    runCommand: 'python3 main.py',
  },
  CPP: {
    dockerImage: 'codearena/cpp',
    sourceFileName: 'main.cpp',
    compileCommand: 'g++ -O2 -o main main.cpp',
    runCommand: './main',
  },
  C: {
    dockerImage: 'codearena/c',
    sourceFileName: 'main.c',
    compileCommand: 'gcc -O2 -o main main.c',
    runCommand: './main',
  },
  JAVASCRIPT: {
    dockerImage: 'codearena/javascript',
    sourceFileName: 'main.js',
    compileCommand: null,
    runCommand: 'node main.js',
  },
};

function of(language) {
  const runtime = RUNTIMES[language];
  if (!runtime) throw new Error(`Unsupported language: ${language}`);
  return { ...runtime, requiresCompilation: Boolean(runtime.compileCommand) };
}

module.exports = { of };
