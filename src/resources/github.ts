interface IGist {
  files: {
    [filename: string]: {
      raw_url: string
    }
  }
  html_url: string
}

export class GithubResource {
  static getGists(username: string): Promise<IGist[]> {
    const fetchOptions: RequestInit = {
      method: 'GET',
      mode: 'cors',
    }

    return fetch(`https://api.github.com/users/${username}/gists`, fetchOptions)
      .then((resp) => resp.json())
  }

  static getGist(id: string): Promise<IGist> {
    const fetchOptions: RequestInit = {
      method: 'GET',
      mode: 'cors',
    }

    return fetch(`https://api.github.com/gists/${id}`, fetchOptions)
      .then((resp) => resp.json())
  }

  static getRawContent(rawURL: string): Promise<any> {
    const fetchOptions: RequestInit = {
      method: 'GET',
      mode: 'cors',
    }

    return fetch(rawURL, fetchOptions)
  }
}
