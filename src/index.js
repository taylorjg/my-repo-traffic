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

const flatten = xs => [].concat(...xs);

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
  }
};

const asyncWrapper = async () => {
  try {
    const login = await scrapeGitHubLogin();
    console.log(`login: ${login}`);

    const reposUrl = `https://api.github.com/users/${login}/repos`;
    const repos = flatten(await getPages(reposUrl, GITHUB_API_CONFIG)).slice(0, 20);
    console.log(`repos.length: ${repos.length}`);

    // const repo = repos[0];
    // const viewsUrl = `https://github.com/${repo.full_name}/graphs/traffic-data`;
    // const clonesUrl = `https://github.com/${repo.full_name}/graphs/clone-activity-data`;
    // const viewsResponse = await axios.get(viewsUrl, GITHUB_WEB_CONFIG);
    // const clonesResponse = await axios.get(clonesUrl, GITHUB_WEB_CONFIG);
    // console.log(`views: ${JSON.stringify(viewsResponse.data, null, 2)}`);
    // console.log(`clones: ${JSON.stringify(clonesResponse.data, null, 2)}`);

    const results = [];
    for (let index = 0; index < repos.length; index++) {
      try {
        const repo = repos[index];
        const viewsUrl = `https://github.com/${repo.full_name}/graphs/traffic-data`;
        const clonesUrl = `https://github.com/${repo.full_name}/graphs/clone-activity-data`;
        const viewsPromise = axios.get(viewsUrl, GITHUB_WEB_CONFIG);
        const clonesPromise = axios.get(clonesUrl, GITHUB_WEB_CONFIG);
        const [{ data: views }, { data: clones }] = await Promise.all([viewsPromise, clonesPromise]);

        const result = {
          repo,
          views,
          clones
        };

        results.push(result);
      }
      catch (err) {
        console.error(`err: ${err}`);
      }
    }
    console.log(`results.length: ${results.length}`);

    // const compareResults = (a, b) => {
    //   const compareViewsCount = b.views.count - a.views.count;
    //   const compareClonesCount = b.clones.count - a.clones.count;
    //   return compareViewsCount ? compareViewsCount : compareClonesCount;
    // };

    // const filteredSortedResults = results
    //   .filter(result => result.views.count || result.clones.count)
    //   .sort(compareResults);

    // const REPO_NAME_COL_WIDTH = 30;
    // const COUNT_COL_WIDTH = 5;

    // filteredSortedResults.forEach(result => {
    //   const repoName = result.repo.name.padEnd(REPO_NAME_COL_WIDTH);
    //   const viewsCount = String(result.views.count).padStart(COUNT_COL_WIDTH);
    //   const viewsUniques = String(result.views.uniques).padStart(COUNT_COL_WIDTH);
    //   const clonesCount = String(result.clones.count).padStart(COUNT_COL_WIDTH);
    //   const clonesUniques = String(result.clones.uniques).padStart(COUNT_COL_WIDTH);
    //   const viewsNumbers = `views: ${viewsCount} / ${viewsUniques}`;
    //   const clonesNumbers = `clones: ${clonesCount} / ${clonesUniques}`;
    //   const stars = `stars: ${result.repo.stargazers_count}`;
    //   console.log(`${repoName}     ${viewsNumbers}     ${clonesNumbers}     ${stars}`);
    // });
  }
  catch (err) {
    console.error(`err: ${err}`);
  }
};

asyncWrapper();
