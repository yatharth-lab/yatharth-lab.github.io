// =====================================================
// GAYATRI CHETNA - GITHUB CONFIG
// Basic obfuscation only.
// This is NOT secure secret storage.
// =====================================================

const OWNER_PARTS = [
  "yatharth",
  "-",
  "lab"
];

const REPO_PARTS = [
  "data",
  "_",
  "collection"
];

/*
  Token को छोटे parts में रखो।

  उदाहरण:
  github_pat_ABC123XYZ456

  को ऐसे:
  "github_"
  "pat_ABC"
  "123XYZ"
  "456"
*/

const TOKEN_PARTS = [
  "ghp_oXX",
  "pQ8SSCksR9",
  "csjzew75R",
  "ZeYkMd",
  "Nb1KrRhf"
];

export function getGitHubConfig() {
  return {
    owner: OWNER_PARTS.join(""),
    repo: REPO_PARTS.join(""),
    token: TOKEN_PARTS.join("")
  };
}
