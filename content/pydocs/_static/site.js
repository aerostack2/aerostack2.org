// Furo cycles through an "auto" value the main site doesn't understand, so this
// toggle replaces it and stores only "light" or "dark" under the shared key.
document.getElementById("as2-theme").addEventListener("click", () => {
  const current = document.body.dataset.theme;
  const dark =
    current === "dark" ||
    (current !== "light" && matchMedia("(prefers-color-scheme: dark)").matches);
  const next = dark ? "light" : "dark";
  document.body.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {}
});

const select = document.getElementById("as2-version");
const path = location.pathname.split("/"); // ["", "pydocs", version, ...page]
const page = path.slice(3).join("/");

fetch("/pydocs/versions.json")
  .then((response) => response.json())
  .then((versions) => {
    for (const version of Object.keys(versions)) {
      select.add(new Option(version, version));
    }
    select.value = path[2];
    select.hidden = false;
  });

// Stays on the same page when the other version has it.
select.addEventListener("change", async () => {
  const root = `/pydocs/${select.value}/`;
  let exists = false;
  try {
    exists = (await fetch(root + page, { method: "HEAD" })).ok;
  } catch {}
  location.href = exists ? root + page + location.hash : root;
});
