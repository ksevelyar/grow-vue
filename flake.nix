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
          pkgs.vue-language-server
          pkgs.vtsls
        ];
        VITE_BACK = "http://grow.localhost:3000";
        VUE_LANGUAGE_SERVER_PATH = "${pkgs.vue-language-server}/lib/language-tools/packages/language-server";
      };

      packages.default = pkgs.buildNpmPackage {
        name = "grow-vue";

        buildInputs = with pkgs; [
          nodejs_24
        ];

        src = self;

        npmDepsHash = "sha256-GAdnWtvFHB8mo1aFijweJU/BfutJkW6P6VE0L/YHq7M=";

        VITE_BACK = "https://api.grow.rusty-cluster.net";
        npmBuild = "npm run build";

        installPhase = ''
          mkdir $out
          cp -r dist/* $out/
        '';
      };
    });
}
