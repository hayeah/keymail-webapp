import * as React from 'react'
import {
  RouteComponentProps,
} from 'react-router-dom'

// component
import {
  Divider,
  Button,
  Icon,
  Upload,
  message,
  List,
} from 'antd'
import AccountListItem from './AccountListItem'
import {
  UploadFile,
} from 'antd/lib/upload/interface.d'
const {
  Dragger,
} = Upload

// style
import * as classnames from 'classnames'
import * as styles from './index.css'

// state management
import {
  inject,
  observer,
} from 'mobx-react'
import {
  IStores,
} from '../../stores'
import {
  MetaMaskStore,
} from '../../stores/MetaMaskStore'
import {
  UsersStore,
  REGISTER_FAIL_CODE,
} from '../../stores/UsersStore'
import {
  IUser,
} from '../../stores/UserStore'

// helper
import {
  storeLogger,
} from '../../utils/loggers'

@inject(({
  metaMaskStore,
  usersStore,
}: IStores) => ({
  metaMaskStore,
  usersStore,
}))
@observer
class Accounts extends React.Component<IProps, IState> {
  public readonly state = Object.freeze({
    registerButtonContent: 'Register',
    isCreatingTransaction: false,
    isImporting: false,
  })

  private readonly injectedProps = this.props as Readonly<IInjectedProps>

  private unmounted = false
  public componentWillUnmount() {
    this.unmounted = true
  }

  public render() {
    const {
      metaMaskStore: {
        currentEthereumNetwork,
        currentEthereumAccount,
      },
      usersStore: {
        users,
        isCurrentUser,
        hasRegisterRecordOnLocal,
        hasRegisterRecordOnChain,
        hasWalletCorrespondingUsableUser,
      },
    } = this.injectedProps
    const {
      isCreatingTransaction,
      registerButtonContent,
    } = this.state

    return (
      <>
        {
          users.length === 0
          ? (
            <h2 className="title">
              Create new account
            </h2>
          )
          : this.getUserList()
        }
        <h3>
          Wallet Address: {currentEthereumAccount}
        </h3>
        {
          !hasRegisterRecordOnLocal
            ? (
              hasRegisterRecordOnChain
                ? <p>This address already registered, please use another wallet address or import existed account.</p>
                : (
                  <>
                    <p>Click the button below and confirm the transaction to create a new account</p>
                    <Button
                      loading={isCreatingTransaction}
                      size="large"
                      type="primary"
                      disabled={isCreatingTransaction}
                      onClick={this.handleRegister}
                    >
                      {registerButtonContent}
                    </Button>
                  </>
                )
            )
            : null
        }
        {
          hasWalletCorrespondingUsableUser
          && !isCurrentUser(currentEthereumNetwork!, currentEthereumAccount!)
          ? (
            <>
              <p>Would you like to swtich to corresponding account?</p>
              <Button
                size="large"
                type="primary"
                onClick={this.handleSwitchToRespondingAccount}
              >
                Switch
              </Button>
            </>
          )
          : null
        }
        <Divider className="container" />
        <h2 className="title">
          Import account
        </h2>
        <Dragger
          className="container"
          action="/"
          beforeUpload={this.handleImport}
          accept=".json"
          disabled={this.state.isImporting}
        >
          <p className="ant-upload-drag-icon">
            <Icon type="plus" />
          </p>
          <p className="ant-upload-text">Click or drag file to this area to import</p>
          <p className="ant-upload-hint">
            Support JSON format exported user data
          </p>
        </Dragger>
      </>
    )
  }

  private getUserList() {
    const {
      usersStore: {
        users,
      },
    } = this.injectedProps
    return (
      <>
        <h2 className="title">
          Manage accounts
        </h2>
        <div className={classnames(styles.userListContainer, 'container')}>
          <List
            rowKey={((user: IUser) => user.userAddress)}
            dataSource={users}
            renderItem={(user: IUser) => (
              <AccountListItem user={user} />
            )}
          />
        </div>
      </>
    )
  }

  private handleRegister = () => {
    this.setState({
      isCreatingTransaction: true,
      registerButtonContent: 'Checking...',
    })

    this.injectedProps.usersStore.register({
      transactionWillCreate: this.transactionWillCreate,
      registerDidFail: this.registerDidFail,
      transactionDidCreate: this.transactionDidCreate,
    })
      .catch(this.registerDidFail)
  }

  private transactionWillCreate = () => {
    if (this.unmounted) {
      return
    }
    this.setState({
      registerButtonContent: 'Please confirm the transaction...',
    })
  }

  private transactionDidCreate = () => {
    if (this.unmounted) {
      return
    }
    this.setState({
      registerButtonContent: 'Register',
      isCreatingTransaction: false,
    })
  }

  private registerDidFail = (err: Error | null, code = REGISTER_FAIL_CODE.UNKNOWN) => {
    if (this.unmounted) {
      return
    }
    message.error((() => {
      switch (code) {
        case REGISTER_FAIL_CODE.OCCUPIED:
          return `Wallet address already registered.`
        case REGISTER_FAIL_CODE.UNKNOWN:
        default:
          if ((err as Error).message.includes('User denied transaction signature')) {
            return 'Register fail, you reject the transaction.'
          }
          storeLogger.error('Unexpected register error:', err as Error)
          return 'Something went wrong, please retry.'
      }
    })())
    this.setState({
      registerButtonContent: 'Register',
      isCreatingTransaction: false,
    })
  }

  private handleSwitchToRespondingAccount = () => {
    const {
      useUser,
      walletCorrespondingUser,
    } = this.injectedProps.usersStore
    useUser(walletCorrespondingUser!)
  }

  private handleImport = (_: UploadFile, files: UploadFile[]) => {
    if (files.length === 0) {
      return false
    }
    this.setState({
      isImporting: true,
    })
    const file: File = files[0] as any
    const reader = new FileReader()
    reader.onload = async (oFREvent) => {
      try {
        const user = await this.injectedProps.usersStore.importUser((oFREvent.target as any).result)
        if (!this.unmounted) {
          if (this.injectedProps.usersStore.users.length === 1) {
            await this.injectedProps.usersStore.useUser(user)
            message.success('You have successfully imported account and logged in!')
          } else {
            message.success('Account imported successfully')
          }
        }
      } catch (err) {
        if (this.unmounted) {
          return
        }
        if ((err as Error).message === 'Network not match') {
          message.error('You were trying to import an account not belongs to current network!')
          return
        }
        if ((err as Error).message.includes('Key already exists in the object store')) {
          message.info('You already have this account!')
          return
        }
        storeLogger.error(err)
        message.error('Something went wrong! Please retry.')
      } finally {
        if (this.unmounted) {
          return
        }
        this.setState({
          isImporting: false,
        })
      }
    }
    reader.readAsText(file)
    return false
  }
}

// typing
type IProps = {}

interface IInjectedProps extends RouteComponentProps<{}> {
  metaMaskStore: MetaMaskStore
  usersStore: UsersStore
}

interface IState {
  registerButtonContent: string
  isCreatingTransaction: boolean
  isImporting: boolean
}

export default Accounts
