{
  description = "grow-vue";
  inputs.nixpkgs.url = "github:nixos/nixpkgs/nixos-26.05";

  outputs = {
    self,
    nixpkgs,
    flake-utils,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs {inherit system;};
    in {
      devShell = pkgs.mkShell {
        buildInputs = [
          pkgs.nodejs_24
        ];
        VITE_BACK = "http://grow.localhost:3000";
      };

      packages.default = pkgs.buildNpmPackage {
        name = "grow-vue";

        buildInputs = with pkgs; [
          nodejs_24
        ];

        src = self;

        npmDepsHash = "sha256-eHpQ5OUHnXNJQY4nBAT6brpqQQIg/6DwNl9AxBE4b4Q=";

        VITE_BACK = "https://api.grow.rusty-cluster.net";
        npmBuild = "npm run build";

        installPhase = ''
          mkdir $out
          cp -r dist/* $out/
        '';
      };
    });
}
