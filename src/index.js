import axios from "axios";

const parseLinkHeader = response => {
  const linkHeader = response.headers["link"];
  if (!linkHeader) {
    return [];
  }
  return linkHeader
    .split(",")
    .map(link => link.split(";").map(s => s.trim()))
    .map(([hrefPart, relPart]) => {
      const href = /^<([^>]+)>$/.exec(hrefPart)[1];
      const rel = /^rel="([^"]+)"$/.exec(relPart)[1];
      return { href, rel };
    });
};

const getPages = async (url, config) => {
  const response = await axios.get(url, config);
  const rels = parseLinkHeader(response);
  const next = rels.find(rel => rel.rel === "next");
  if (next) {
    return [response.data, ...await getPages(next.href, config)];
  }
  else {
    return [response.data];
  }
};

const range = n =>
  Array.from(Array(n).keys());

const flatten = xs =>
  [].concat(...xs);

const chunksOf = (n, xs) =>
  range(Math.ceil(xs.length / n))
    .map(i => [i * n, i * n + n])
    .map(([start, end]) => xs.slice(start, end));

const scrapeGitHubLogin = async () => {
  const response = await axios.get("https://github.com");
  const matches = response.data.match(/<meta name="user-login" content="([^"]+)">/);
  return matches[1].trim();
};

const GITHUB_API_CONFIG = {
  params: {
    "per_page": 100
  },
  headers: {
    "Accept": "application/vnd.github.v3+json"
  }
};

const GITHUB_WEB_CONFIG = {
  headers: {
    "Accept": "application/json"
  },
  withCredentials: true
};

const addTableRow = result => {
  const row = document.createElement("tr");
  const td1 = document.createElement("td");
  const td2 = document.createElement("td");
  const td3 = document.createElement("td");
  const td4 = document.createElement("td");
  const td5 = document.createElement("td");
  td1.innerText = result.repo.name;
  td2.innerText = result.views.summary.total;
  td3.innerText = result.views.summary.unique;
  td4.innerText = result.clones.summary.total;
  td5.innerText = result.clones.summary.unique;
  row.appendChild(td1);
  row.appendChild(td2);
  row.appendChild(td3);
  row.appendChild(td4);
  row.appendChild(td5);
  document.querySelector("tbody").appendChild(row);
};

const populateTable = results =>
  results.forEach(addTableRow);

const asyncWrapper = async () => {
  try {
    const login = await scrapeGitHubLogin();
    console.log(`login: ${login}`);

    const MAX_NUM_REPOS = 149;

    const reposUrl = `https://api.github.com/users/${login}/repos?sort=created&direction=desc`;
    const repos = flatten(await getPages(reposUrl, GITHUB_API_CONFIG)).slice(0, MAX_NUM_REPOS);
    console.log(`repos.length: ${repos.length}`);

    const results = [];

    const BATCH_SIZE = MAX_NUM_REPOS;
    const repoChunks = chunksOf(BATCH_SIZE, repos);

    for (let chunkIndex = 0; chunkIndex < repoChunks.length; chunkIndex++) {
      const repoChunk = repoChunks[chunkIndex];
      const chunkPromises = [];
      for (let repoIndex = 0; repoIndex < repoChunk.length; repoIndex++) {
        const repo = repoChunk[repoIndex];
        const viewsUrl = `https://github.com/${repo.full_name}/graphs/traffic-data`;
        const clonesUrl = `https://github.com/${repo.full_name}/graphs/clone-activity-data`;
        const repoPromise = Promise.resolve(repo);
        const viewsPromise = axios.get(viewsUrl, GITHUB_WEB_CONFIG);
        const clonesPromise = axios.get(clonesUrl, GITHUB_WEB_CONFIG);
        const repoPromises = Promise.all([repoPromise, viewsPromise, clonesPromise]);
        chunkPromises.push(repoPromises);
      }
      console.log(`waiting for all repo promises within chunk ${chunkIndex + 1} of ${repoChunks.length}...`);
      const chunkResponses = await Promise.all(chunkPromises);
      chunkResponses.forEach(([repo, { data: views }, { data: clones }]) => {
        const result = {
          repo,
          views,
          clones
        };
        results.push(result);
      });
    }
    console.log(`results.length: ${results.length}`);

    const compareResults = (a, b) => {
      const compareViewsCount = b.views.summary.total - a.views.summary.total;
      const compareClonesCount = b.clones.summary.total - a.clones.summary.total;
      return compareViewsCount ? compareViewsCount : compareClonesCount;
    };

    const filteredSortedResults = results
      .filter(result => result.views.summary.total || result.clones.summary.total)
      .sort(compareResults);

    populateTable(filteredSortedResults);
  }
  catch (err) {
    console.error(`err: ${err}`);
  }
};

asyncWrapper();
