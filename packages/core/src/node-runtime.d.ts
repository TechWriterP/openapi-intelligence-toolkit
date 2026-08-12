declare module "node:crypto" {
  interface Hash {
    update(data: Uint8Array): Hash;
    digest(encoding: "hex"): string;
  }

  export function createHash(algorithm: "sha256"): Hash;
}

declare module "node:fs/promises" {
  export function readFile(path: string): Promise<Uint8Array>;
  export function realpath(path: string): Promise<string>;
}

declare module "node:url" {
  export function fileURLToPath(url: string): string;
}
