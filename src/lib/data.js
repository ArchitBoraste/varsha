// Loads the static data files in public/data, each at most once per session.

const requests = new Map();
const results = new Map();

export function loadData(file) {
  if (!requests.has(file)) {
    const request = fetch(`${import.meta.env.BASE_URL}data/${file}`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(response.statusText))))
      .then(
        (data) => {
          results.set(file, data);
          return data;
        },
        () => {
          requests.delete(file); // allow a retry
          throw new Error(`Could not load data/${file}. Run "npm run data" to generate it.`);
        },
      );
    requests.set(file, request);
  }
  return requests.get(file);
}

/** The file's contents if it has already loaded, otherwise undefined. */
export const peekData = (file) => results.get(file);
