interface Igist {
  files: {
    [filename: string]: {
      raw_url: string
    }
  }
  html_url: string
}

export class GithubResource {
  static async getGists(username: string): Promise<Igist[]> {
    const init = {
      method: 'GET',
      mode: 'cors',
    } as RequestInit

    return await fetch(`https://api.github.com/users/${username}/gists`, init)
      .then((resp) => resp.json())
  }

  static async getGist(id: string): Promise<Igist> {
    const init = {
      method: 'GET',
      mode: 'cors',
    } as RequestInit

    return await fetch(`https://api.github.com/gists/${id}`, init)
      .then((resp) => resp.json())
  }

  static async getRawContent(rawURL: string): Promise<any> {
    const init = {
      method: 'GET',
      mode: 'cors',
    } as RequestInit

    return await fetch(rawURL, init)
  }
}