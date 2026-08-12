import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const policyPath = join(repositoryRoot, "architecture-boundaries.json");
const dependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];
const sourceExtensions = new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"]);
const excludedDirectories = new Set(["build", "coverage", "dist", "node_modules"]);

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const toPosix = (path) => path.split(sep).join("/");
const displayPath = (path) => toPosix(relative(repositoryRoot, path));
const isWithin = (path, directory) => {
  const child = relative(directory, path);
  return child === "" || (!child.startsWith(`..${sep}`) && child !== ".." && !isAbsolute(child));
};

async function collectSourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectSourceFiles(path));
    else if (entry.isFile() && sourceExtensions.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function extractSpecifiers(source) {
  const patterns = [
    /\b(?:import|export)\s+(?:type\s+)?(?:[^;"']*?\s+from\s+)?["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\brequire\s*\(\s*["']([^"']+)["']\s*\)/g,
  ];
  const found = [];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) found.push(match[1]);
  }
  return [...new Set(found)].sort();
}

const policy = await readJson(policyPath);
const workspaceEntries = Object.entries(policy.workspaces).sort(([left], [right]) => left.localeCompare(right));
const workspaceNames = new Set(workspaceEntries.map(([name]) => name));
const candidateNames = new Set(policy.candidateDependencies);
const workspaceRoots = new Map(
  workspaceEntries.map(([name, rules]) => [name, resolve(repositoryRoot, rules.path)]),
);
const errors = [];
let sourceFileCount = 0;

for (const [workspaceName, rules] of workspaceEntries) {
  const workspaceRoot = workspaceRoots.get(workspaceName);
  const manifestPath = join(workspaceRoot, "package.json");
  let manifest;
  try {
    manifest = await readJson(manifestPath);
  } catch (error) {
    errors.push(`${displayPath(manifestPath)}: cannot read a valid package manifest (${error.message})`);
    continue;
  }

  if (manifest.name !== workspaceName) {
    errors.push(`${displayPath(manifestPath)}: expected package name ${workspaceName}, found ${String(manifest.name)}`);
  }

  const exportKeys = manifest.exports && typeof manifest.exports === "object"
    ? Object.keys(manifest.exports).sort()
    : [];
  if (exportKeys.length !== 1 || exportKeys[0] !== ".") {
    errors.push(`${displayPath(manifestPath)}: exports must expose only the explicit package root "."`);
  }

  const allowedInternal = new Set(rules.mayDependOn);
  const allowedCandidates = new Set(rules.candidateDependencies);
  const declaredDependencies = new Set();
  for (const section of dependencySections) {
    for (const dependency of Object.keys(manifest[section] ?? {}).sort()) {
      declaredDependencies.add(dependency);
      if (workspaceNames.has(dependency) && !allowedInternal.has(dependency)) {
        errors.push(`${displayPath(manifestPath)}: ${section}.${dependency} violates the allowed dependency graph for ${workspaceName}`);
      }
      if (candidateNames.has(dependency) && !allowedCandidates.has(dependency)) {
        errors.push(`${displayPath(manifestPath)}: ${section}.${dependency} places a candidate dependency outside its designated integration package`);
      }
    }
  }

  const sourceRoot = join(workspaceRoot, "src");
  let sourceFiles = [];
  try {
    sourceFiles = await collectSourceFiles(sourceRoot);
  } catch (error) {
    errors.push(`${displayPath(sourceRoot)}: cannot inspect source files (${error.message})`);
  }
  sourceFileCount += sourceFiles.length;

  for (const sourcePath of sourceFiles.sort()) {
    const source = await readFile(sourcePath, "utf8");
    for (const specifier of extractSpecifiers(source)) {
      if (specifier === "experiments" || specifier.startsWith("experiments/") || specifier.split("/").includes("experiments")) {
        errors.push(`${displayPath(sourcePath)}: production source must not import experiment code (${specifier})`);
        continue;
      }

      const internalTarget = [...workspaceNames]
        .sort((left, right) => right.length - left.length)
        .find((name) => specifier === name || specifier.startsWith(`${name}/`));
      if (internalTarget) {
        if (specifier !== internalTarget) {
          errors.push(`${displayPath(sourcePath)}: deep import ${specifier} is forbidden; import the public root ${internalTarget}`);
        } else if (internalTarget !== workspaceName && !allowedInternal.has(internalTarget)) {
          errors.push(`${displayPath(sourcePath)}: import ${specifier} violates the allowed dependency graph for ${workspaceName}`);
        } else if (internalTarget !== workspaceName && !declaredDependencies.has(internalTarget)) {
          errors.push(`${displayPath(sourcePath)}: import ${specifier} is not declared in ${displayPath(manifestPath)}`);
        }
        continue;
      }

      const candidate = [...candidateNames]
        .sort((left, right) => right.length - left.length)
        .find((name) => specifier === name || specifier.startsWith(`${name}/`));
      if (candidate) {
        if (!allowedCandidates.has(candidate)) {
          errors.push(`${displayPath(sourcePath)}: candidate import ${specifier} is outside a designated integration package`);
        } else if (!declaredDependencies.has(candidate)) {
          errors.push(`${displayPath(sourcePath)}: candidate import ${specifier} is not declared in ${displayPath(manifestPath)}`);
        }
        continue;
      }

      if (specifier.startsWith(".")) {
        const resolvedImport = resolve(dirname(sourcePath), specifier);
        for (const [targetName, targetRoot] of workspaceRoots) {
          if (targetName !== workspaceName && isWithin(resolvedImport, targetRoot)) {
            errors.push(`${displayPath(sourcePath)}: relative cross-workspace import ${specifier} bypasses the public package root ${targetName}`);
          }
        }
        if (isWithin(resolvedImport, join(repositoryRoot, "experiments"))) {
          errors.push(`${displayPath(sourcePath)}: relative import ${specifier} reaches isolated experiment code`);
        }
      }
    }
  }
}

errors.sort();
if (errors.length > 0) {
  console.error("Architecture boundary check failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Architecture boundary check passed (${workspaceEntries.length} workspaces, ${sourceFileCount} source files).`);
}
