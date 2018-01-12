import * as React from 'react'

import { inject, observer } from 'mobx-react'

import {
  Link,
} from 'react-router-dom'
import CommonHeaderPage from '../../containers/CommonHeaderPage'
import HashAvatar from '../../components/HashAvatar'
import { Store } from '../../store'
import {
  getBEMClassNamesMaker,
} from '../../utils'

import {
  USER_STATUS,
  SOCIAL_MEDIALS,
  TRUSTBASE_CONNECT_STATUS,
} from '../../constants'

import { sha3 } from 'trustbase'

import { Icon } from 'antd'

interface Iprops {
  store: Store
}
interface Istate {
  isProving: boolean
}

@inject('store') @observer
class Profile extends React.Component<Iprops, Istate> {
  constructor(props: Iprops) {
    super(props)

    this.state = {
      isProving: false,
    }
  }

  private readonly getBEMClassNames = getBEMClassNamesMaker('profile', this.props)
  public componentDidMount(isFirstMount: boolean = true) {
    const {
      connectStatus,
      currentUser,
      isFetchingMessage,
      startFetchBoundEvents,
    } = this.props.store
    if (connectStatus === TRUSTBASE_CONNECT_STATUS.SUCCESS && currentUser && !isFetchingMessage) {
      startFetchBoundEvents()
    }
  }

  public render() {
    const {
      currentUser,
      currentUserBoundSocials,
    } = this.props.store
    if (!currentUser) {
      return null
    }

    const { getBEMClassNames } = this
    const userAvatar = (() => {
      const avatarShape = 'square'
      const avatarSize = 'large'
      const avatarClassName = getBEMClassNames('user-avatar')

      return (
        <HashAvatar
          className={avatarClassName}
          shape={avatarShape}
          size={avatarSize}
          hash={currentUser.status !== USER_STATUS.PENDING
            ? sha3(`${currentUser.userAddress}${currentUser.blockHash}`)
            : ''
          }
        />
      )
    })()

    const socials = (() => {
      if (this.state.isProving) {
        return null
      }

      const socialsElements = []
      for (let social of SOCIAL_MEDIALS) {
        const boundSocial = currentUserBoundSocials[social.platform]
        let stateText = null
        if (typeof boundSocial === 'undefined') {
          stateText = <Link to={`/proving/${social.platform}`}>Prove your {social.label}</Link>
        } else {
          stateText = <a>{boundSocial.username}@{social.platform}</a>
        }
        socialsElements.push(
          <li>
            <Icon type={social.platform} style={{marginRight: '5px'}}/>
            {stateText}
          </li>
        )
      }
      return <ul>{socialsElements}</ul>
    })()

    return <CommonHeaderPage>
      {userAvatar}
      {socials}
    </CommonHeaderPage>
  }
}

export default Profile
