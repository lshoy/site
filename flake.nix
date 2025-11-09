{
  description = "Dev shell for Next.js static blog (Markdown) using latest Node";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];
      forAllSystems = f: nixpkgs.lib.genAttrs systems (system:
        f (import nixpkgs { inherit system; })
      );
    in
    {
      devShells = forAllSystems (pkgs: let
        node = pkgs.nodejs_22;
        pnpm = pkgs.nodePackages_latest.pnpm;
      in {
        default = pkgs.mkShell {
          packages = [
            node
            pnpm
            pkgs.git
            pkgs.python3
            pkgs.pkg-config
            pkgs.gnumake
            pkgs.gcc
            pkgs.vips # for sharp fallback builds if needed
            pkgs.openssl
            pkgs.zlib
            pkgs.watchexec
            pkgs.chromium
          ];

          # Keep caches inside the project to avoid touching global dirs
          shellHook = ''
            export NPM_CONFIG_CACHE="$PWD/.npm-cache"
            export PNPM_STORE_DIR="$PWD/.pnpm-store"
            export PATH="$PWD/node_modules/.bin:$PATH"
            export CHROMIUM_BIN="${pkgs.chromium}/bin/chromium"
            echo "Dev shell ready: node $(node -v), pnpm $(pnpm -v)"
            echo "Local caches: $NPM_CONFIG_CACHE | $PNPM_STORE_DIR"
          '';
        };
      });
    };
}
