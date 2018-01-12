import {
  SOCIAL_MEDIA_PLATFORMS,
  BINDING_SOCIAL_STATUS,
} from '../src/constants'

interface IboundSocial {
  username: string
  proofURL: string
}

interface IboundSocials {
  twitter?: IboundSocial,
  github?: IboundSocial,
}

interface IsignedBoundSocials {
  socialMedias: IboundSocials
  signature: string
}

interface IgithubClaim {
  userAddress: string
  service: {
    name: string,
    username: string,
  },
  ctime: number,
  publicKey: string
}

interface IsignedGithubClaim {
  githubClaim: IgithubClaim
  signature: string
}

interface IbindingSocial extends IboundSocial {
  signedClaim: IsignedGithubClaim
  status: BINDING_SOCIAL_STATUS
}

interface Igist {
  files: {
    [filename: string]: {
      raw_url: string
    }
  }
  html_url: string
}

interface IbindingSocials {
  twitter?: IbindingSocial
  github?: IbindingSocial
} 
