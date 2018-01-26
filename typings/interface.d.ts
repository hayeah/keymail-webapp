import * as web3 from 'trustbase/typings/web3.d'

import { Dexie } from 'dexie'
import {
  derived,
  keys
} from 'wire-webapp-proteus'

import {
  REGISTER_FAIL_CODE,
  SENDING_FAIL_CODE,
  MESSAGE_TYPE,
  USER_STATUS,
  MESSAGE_STATUS,
  SOCIAL_MEDIA_PLATFORMS,
  ETHEREUM_NETWORKS,
} from '../src/constants'

import {
  IboundSocials,
  IbindingSocials,
} from './proof.interface'

export interface IpreKeyPublicKeys {
  [preKeyId: string]: string
}

export interface IasyncProvider {
  sendAsync(payload: web3.JsonRPCRequest, callback: (e: Error, val: web3.JsonRPCResponse) => void): void
}

export interface IuploadPreKeysLifecycle {
  preKeysDidUpload?: () => void
  preKeysUploadDidFail?: (err: Error) => void
}

export interface IcreateAccountLifecycle {
  accountWillCreate?: () => void
  accountDidCreate?: () => void
}

export interface IcheckMessageStatusLifecycle {
  sendingDidFail?: () => void
}

export interface IcheckIdentityUploadStatusLifecycle {
  checkRegisterWillStart?: (hash: string) => void
  identityDidUpload?: () => void
  registerDidFail?: (err: Error | null, code?: REGISTER_FAIL_CODE) => void
}

interface transactionLifecycle {
  transactionWillCreate?: () => void
  transactionDidCreate?: (transactionHash: string) => void
}

export interface IregisterLifecycle extends transactionLifecycle {
  registerDidFail?: (err: Error | null, code?: REGISTER_FAIL_CODE) => void
}

export interface IsendingLifecycle extends transactionLifecycle {
  sendingDidComplete?: () => void
  sendingDidFail?: (err: Error | null, code?: SENDING_FAIL_CODE) => void
}

export interface IenvelopeHeader {
  senderIdentity: keys.IdentityKey
  mac: Uint8Array
  baseKey: keys.PublicKey
  sessionTag: string
  isPreKeyMessage: boolean
  messageByteLength: number
}

export interface IbroadcastMessage {
  message: string
  timestamp: number
}

export interface IsignedBroadcastMessage extends IbroadcastMessage {
  signature: string
}

export interface IreceviedBroadcastMessage extends IsignedBroadcastMessage {
  author: string
  isInvalidTimestamp: boolean
  blockTimestamp?: number // if isInvalidTimestamp is true, it will be filled
}

interface IuserIdentityKeys {
  networkId: ETHEREUM_NETWORKS,
  userAddress: string,
}

export interface IregisterRecord {
  identityTransactionHash: string
  identity: string
}

export interface Iuser extends IuserIdentityKeys {
  lastFetchBlock: web3.BlockType
  lastFetchBlockOfBroadcast: web3.BlockType
  lastFetchBlockOfBoundSocials: web3.BlockType
  contacts: Icontact[]
  status: USER_STATUS
  registerRecord?: IregisterRecord
  blockHash: string
  boundSocials: IboundSocials
  bindingSocials: IbindingSocials
}

interface Icontact {
  userAddress: string
  blockHash: string
}

export interface Isession extends IuserIdentityKeys {
  sessionTag: string
  lastUpdate: number
  contact: Icontact
  subject: string
  isClosed: boolean
  unreadCount: number
  summary: string
}

export interface Imessage extends IuserIdentityKeys {
  messageId: string
  sessionTag: string
  messageType: MESSAGE_TYPE
  timestamp: number
  isFromYourself: boolean
  plainText?: string
  transactionHash?: string
  status: MESSAGE_STATUS
}
export type web3BlockType = web3.BlockType

interface ItrustbaseRawMessage {
  message: string
  timestamp: string
}

interface IdecryptedTrustbaseMessage {
  decryptedPaddedMessage: Uint8Array
  senderIdentity: keys.IdentityKey
  timestamp: string
  messageByteLength: number
}

interface IrawUnppaddedMessage {
  messageType: MESSAGE_TYPE
  timestamp: number
  subject: string
  fromUserAddress?: string
  plainText?: string
}

interface IreceivedMessage extends IrawUnppaddedMessage {
  mac: Uint8Array
  sessionTag: string
  timestamp: number
  blockHash?: string
}

interface IDumpedTable {
  table: string
  rows: any[]
}

interface IDumpedDatabases {
  [dbname: string]: IDumpedTable[]
}
