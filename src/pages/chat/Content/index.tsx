import * as React from 'react'

// component
import {
  List,
  Button,
} from 'antd'
import Session from '../Session'
import NewConversationDialog from '../NewConversationDialog'
import Dialog from '../Dialog'

// style
import * as styles from './index.css'
import * as classnames from 'classnames'

// state management
import {
  observer,
} from 'mobx-react'
import {
  UserStore,
} from '../../../stores/UserStore'
import {
  ISession,
} from '../../../stores/SessionStore'

@observer
class ChatContent extends React.Component<IProps> {
  public componentDidMount() {
    this.userStoreDidLoad(this.props.userStore)
  }

  public componentWillUnmount() {
    this.userStoreWillunload(this.props.userStore)
  }

  public componentWillUpdate({userStore: nextUserStore}: IProps) {
    const currentUserStore = this.props.userStore
    if (nextUserStore !== currentUserStore) {
      this.userStoreWillunload(currentUserStore)
    }
  }

  public componentDidUpdate({userStore: prevUserStore}: IProps) {
    const currentUserStore = this.props.userStore
    if (prevUserStore !== currentUserStore) {
      this.userStoreDidLoad(currentUserStore)
    }
  }

  public render() {
    const {
      user: {
        userAddress,
      },
      sessionsStore,
      chatMessagesStore,
    } = this.props.userStore

    return (
      <div className={styles.content}>
        <div className={styles.sessionList}>
          <div className={styles.sessionListTopBar}>
            <Button
              onClick={this.handleNewConversationClick}
              className={styles.newConversationButton}
              icon="plus"
              size="small"
              type="primary"
            />
          </div>
          <List
            className={styles.sessionListInner}
            dataSource={sessionsStore.sessions}
            renderItem={(session: ISession) => (
              <Session
                className={classnames({
                  [styles.selectedSession]: sessionsStore.isCurrentSession(session.userAddress, session.sessionTag),
                })}
                key={session.sessionTag}
                sessionStore={sessionsStore.getSessionStore(session)}
                onClick={this.handleSelectSession}
              />
            )}
            // Here is a hack, since antd does not provide renderEmpty prop
            // you can actually put any JSX.Element into emptyText
            locale={{emptyText: <>No session</>}}
          />
        </div>
        {
          sessionsStore.hasSelectedSession
            ? <Dialog chatMessagesStore={chatMessagesStore!} sessionStore={sessionsStore.currentSessionStore!} />
            : <NewConversationDialog chatMessagesStore={chatMessagesStore!} selfAddress={userAddress} />
        }
      </div>
    )
  }

  private handleSelectSession = async (session: ISession) => {
    const {
      sessionsStore,
    } = this.props.userStore
    if (
      !sessionsStore.isSwitchingSession
      && !sessionsStore.isCurrentSession(session.userAddress, session.sessionTag)
    ) {
      // TODO: catch and warn if session data could load
      await sessionsStore.selectSession(session)
    }
  }

  private handleNewConversationClick = () => {
    this.props.userStore.sessionsStore.unselectSession()
  }

  private userStoreDidLoad = (userStore: UserStore) => {
    userStore.chatMessagesStore.startFetchChatMessages()
    if (!userStore.sessionsStore.isLoaded) {
      userStore.sessionsStore.loadSessions()
    }
  }

  private userStoreWillunload = (userStore: UserStore) => {
    userStore.chatMessagesStore.stopFetchChatMessages()
  }
}

interface IProps {
  userStore: UserStore
}

export default ChatContent
