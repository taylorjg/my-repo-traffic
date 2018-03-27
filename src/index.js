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

// const handleError = err => {
//   if (err.response) {
//     const response = err.response;
//     const request = response.request;
//     const status = response.status;
//     const statusText = response.statusText;
//     if (response.data && response.data.message) {
//       console.log(`[${request.method} ${request.path}] status: ${status}; statusText: ${statusText}; message: ${response.data.message}`);
//     }
//     else {
//       console.log(`[${request.method} ${request.path}] status: ${status}; statusText: ${statusText}; err: ${err}`);
//     }
//   }
//   else {
//     if (err.config) {
//       console.log(`[${err.config.method} ${err.config.url}] err: ${err}`);
//     }
//     else {
//       console.log(`err: ${err}`);
//     }
//   }
// };

const flatten = xs => [].concat(...xs);

const getLogin = async () => {
  const response = await axios.get("https://github.com");
  const matches = response.data.match(/<meta name="user-login" content="([^"]+)">/);
  return matches[1].trim();
};

const asyncWrapper = async () => {
  try {
    const login = await getLogin();
    console.log(`login: ${login}`);

    const url1 = `https://api.github.com/users/${login}/repos`;
    const config1 = {
      params: {
        "per_page": 100
      },
      headers: {
        "Accept": "application/vnd.github.v3+json"
      }
    };
    const repos = flatten(await getPages(url1, config1));
    console.log(`repos.length: ${repos.length}`);

    const repo = repos[0];
    const urlViews = `https://github.com/${repo.full_name}/graphs/traffic-data`;
    const urlClones = `https://github.com/${repo.full_name}/graphs/clone-activity-data`;
    const config2 = {
      headers: {
        "Accept": "application/json"
      }
    };

    const responseViews = await axios.get(urlViews, config2);
    console.log(`views: ${JSON.stringify(responseViews.data, null, 2)}`);

    const responseClones = await axios.get(urlClones, config2);
    console.log(`clones: ${JSON.stringify(responseClones.data, null, 2)}`);

    // const results = [];
    // for (let index = 0; index < repos.length; index++) {
    //   try {
    //     const repo = repos[index];
    //     const viewsPromise = axios.get(`/repos/${repo.owner.login}/${repo.name}/traffic/views`);
    //     const clonesPromise = axios.get(`/repos/${repo.owner.login}/${repo.name}/traffic/clones`);
    //     const [{ data: views }, { data: clones }] = await Promise.all([viewsPromise, clonesPromise]);

    //     const result = {
    //       repo,
    //       views,
    //       clones
    //     };

    //     results.push(result);
    //   }
    //   catch (err) {
    //     console.log(`err: ${err}`);
    //   }
    // }

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
    console.log(`err: ${err}`);
  }
};

asyncWrapper();
