import { simpleGet } from '../common/fetchers'
import { post } from '../common/mutations'

export const getServerStatus = simpleGet

export const loginServer = post
