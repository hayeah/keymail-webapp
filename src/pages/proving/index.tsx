import * as React from 'react'

import { inject, observer } from 'mobx-react'

import {
  Redirect,
  RouteComponentProps,
} from 'react-router-dom'

import CommonHeaderPage from '../../containers/CommonHeaderPage'
import { Store } from '../../store'

import { Icon } from 'antd'
import {
  SOCIAL_MEDIA_PLATFORMS,
  SOCIAL_MEDIALS,
  BINDING_SOCIAL_STATUS,
  GITHUB_GIST_FILENAME,
} from '../../constants'

import {
  storeLogger
} from '../../utils'

import {
  Igist,
  IgithubClaim,
  IsignedGithubClaim,
  IbindingSocial,
} from '../../../typings/proof.interface'

import {
  Link,
} from 'react-router-dom'

interface Iparams {
  platform: string
}
interface Iprops extends RouteComponentProps<Iparams> {
  store: Store
}

interface Istate {
  isProving: boolean
  username: string
  platform: string
  claim?: IsignedGithubClaim
  successful: boolean
}

const getGithubClaim = (signedClaim: IsignedGithubClaim) => {
  const {
    githubClaim: claim,
    signature,
  } = signedClaim
  const claimStr = JSON.stringify(claim, undefined, '  ')
  return `### Keymail proof

I hereby claim:

  * I am ${claim.service.username} on github
  * I am ${claim.userAddress} on Keymail
  * I have a public key ${claim.publicKey}

To Claim this, I am signing this object:

\`\`\`json
${claimStr}
\`\`\`

with the key ${claim.publicKey}, yielding the signature:

\`\`\`
${signature}
\`\`\`
`
}

@inject('store') @observer
class Proving extends React.Component<Iprops, Istate> {
  constructor(props: Iprops) {
    super(props)

    this.state = {
      isProving: false,
      username: '',
      platform: props.match.params.platform,
      successful: false,
    }
  }

  private claimTextarea: any

  public render() {
    const {
      currentUser,
    } = this.props.store
    if (typeof currentUser === 'undefined') {
      return <CommonHeaderPage>
        <Link to="/">Back to index</Link>
      </CommonHeaderPage>
    }

    const platform = this.state.platform
    if (!Object.values(SOCIAL_MEDIA_PLATFORMS).includes(platform)) {
      return <CommonHeaderPage>
        <p>Invalid platform: {platform}</p>
        <Link to="/profile">Back to profile</Link>
      </CommonHeaderPage>
    }

    let socialMedia: any = {}
    for (let sm of SOCIAL_MEDIALS) {
      if (sm.platform === platform) {
        socialMedia = sm
      }
    }

    const steps = (() => {
      if (!this.state.isProving) {
        return <div>
          <h3>Prove your {socialMedia.label} identity</h3>
          <input
            value={this.state.username}
            onChange={this.handleChange}
            placeholder={`Your ${socialMedia.label} username`}
          />
          <br />
          <Link to="/profile">Cancel</Link>
          <a onClick={this.handleContinue}>Continue</a>
        </div>
      } else if (typeof this.state.claim !== 'undefined') {
        return <div>
          <p>{this.state.username}</p>
          <p>@{this.state.platform}</p>
          <p>Login to GitHub and paste the text below into a public gist called {GITHUB_GIST_FILENAME}.</p>
          <textarea
            cols={80}
            rows={15}
            onClick={this.focusClaimTextarea}
            ref={(textarea) => { this.claimTextarea = textarea }}
            value={getGithubClaim(this.state.claim)}
            readOnly={true}
          />

          <br />
          <a href="https://gist.github.com/" target="_blank">Create gist now</a>

          <br />
          <Link to="/profile">Cancel</Link>

          <br />
          <a onClick={this.checkProof}>OK posted! Check for it!</a>

          <br />
          <a onClick={this.uploadProof}>Upload the proof to blockchain!</a>
        </div>
      } else {
        return null
      }
    })()

    if (this.state.successful) {
      return <Redirect to="/profile" />
    }
    return <CommonHeaderPage>
      <div style={{marginBottom: '8px'}}>
        <Icon type={platform} style={{fontSize: 60}}/>
        {steps}
      </div>
    </CommonHeaderPage>
  }

  private uploadProof = async () => {
    this.props.store.uploadBindingSocials({
      transactionDidCreate: () => {
        storeLogger.log('created')
      },
      sendingDidComplete: () => {
        storeLogger.log('completed')
        this.setState({ successful: true })
      }
    })
  }
  private checkProof = async () => {
    const init = {
      method: 'GET',
      mode: 'cors',
    } as RequestInit

    const gists: Igist[] = await fetch(`https://api.github.com/users/${this.state.username}/gists`, init)
    .then((resp) => resp.json())

    let proofURL: string = ''
    let proofRawURL: string = ''
    for (let gist of gists) {
      if (Object.keys(gist.files).includes(GITHUB_GIST_FILENAME)) {
        proofURL = gist.html_url
        proofRawURL = gist.files[GITHUB_GIST_FILENAME].raw_url
        break
      }
    }
    if (proofURL === '') {
      // did not find the contract
      alert('could not found proof url')
      return
    }

    const signedClaim: IsignedGithubClaim|null = await fetch(proofRawURL, init)
    .then((resp) => resp.text())
    .then((text) => {
      const matches = /\`\`\`json([\s\S]*?)\`\`\`[\s\S]*?\`\`\`\s*(.*?)\s*\`\`\`/g.exec(text)
      if (matches === null || matches.length !== 3) {
        return null
      }
      const _claim: IgithubClaim = JSON.parse(matches[1])
      const _signature = matches[2]
      return {
        githubClaim: _claim,
        signature: _signature,
      } as IsignedGithubClaim
    })
    if (signedClaim === null) {
      // do something here with a mismatch
      alert('text could not match')
      return
    }

    if (JSON.stringify(this.state.claim) === JSON.stringify(signedClaim)) {
      const bindingSocial: IbindingSocial = {
        status: BINDING_SOCIAL_STATUS.CHECKED,
        signedClaim: signedClaim,
        proofURL: proofURL,
        username: signedClaim.githubClaim.service.username
      }
      this.props.store.addBindingSocial(SOCIAL_MEDIA_PLATFORMS.GITHUB, bindingSocial)
      alert('Congratulations! the claim is verified!')
    } else {
      alert('the claim is not match')
    }
  }

  private focusClaimTextarea = () => {
    this.claimTextarea.focus()
    this.claimTextarea.select()
  }

  private handleContinue = async (e: any) => {
    const {
      currentUser,
      getCurrentUserPublicKey
    } = this.props.store

    if (typeof currentUser === 'undefined') {
      return
    }

    const currentUserPublicKey = await getCurrentUserPublicKey()

    switch (this.state.platform) {
      case SOCIAL_MEDIA_PLATFORMS.GITHUB:
        const githubClaim: IgithubClaim = {
          userAddress: currentUser.userAddress,
          service: {
            name: SOCIAL_MEDIA_PLATFORMS.GITHUB,
            username: this.state.username,
          },
          ctime: Math.floor(Date.now() / 1000),
          publicKey: currentUserPublicKey,
        }
        const signature = '0x' + this.props.store.currentUserSign(JSON.stringify(githubClaim))
        const signedGithubClaim: IsignedGithubClaim = {
          githubClaim,
          signature,
        }
        this.setState({
          isProving: true,
          claim: signedGithubClaim
        })
        break
      case SOCIAL_MEDIA_PLATFORMS.TWITTER:
        break
      case SOCIAL_MEDIA_PLATFORMS.FACEBOOK:
        break
      case SOCIAL_MEDIA_PLATFORMS.HACKER_NEWS:
        break
      default:
    }
  }

  private handleChange = (e: any) => {
    this.setState({username: e.target.value})
  }
}

export default Proving
