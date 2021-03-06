import { call, delay, put } from 'redux-saga/effects'
import axios from '../../axios'
import * as actions from '../actions/index'
import Axios from 'axios'

export function* logoutSaga(action) {
  yield call([localStorage, 'removeItem'], 'token')
  yield call([localStorage, 'removeItem'], 'expirationDate')
  yield call([localStorage, 'removeItem'], 'userId')
  yield put(actions.logoutSucceed())
  yield axios.get('user/logout')
}

export function* checkAuthTimeoutSaga(action) {
  yield delay(action.expirationTime, actions.logout())
}

export function* authUserSaga(action) {
  yield put(actions.authStart())
  const authData = { ...action.user }
  const prefix = '/api/v1/user/'
  let url = prefix + 'login'
  if (action.isSignup) {
    url = prefix + 'signup'
  }
  try {
    const res = yield Axios.post(url, authData)
    const expirationDate = yield new Date(Date.now() + res.data.expiresIn)
    yield localStorage.setItem('token', res.data.token)
    yield localStorage.setItem('expirationDate', expirationDate)
    yield localStorage.setItem('userId', res.data.userId)
    yield put(actions.authSuccess(res.data.token, res.data.userId))
    yield put(actions.checkAuthTimeout(res.data.expiresIn))
  } catch (error) {
    yield put(actions.authFail(error.response.data))
  }
}

export function* authCheckStateSaga(action) {
  const token = yield localStorage.getItem('token')
  if (!token) {
    yield put(actions.logout())
  } else {
    const expirationDate = yield new Date(
      localStorage.getItem('expirationDate')
    )
    if (expirationDate <= new Date()) {
      yield put(actions.logout())
    } else {
      const userId = yield localStorage.getItem('userId')
      yield put(actions.authSuccess(token, userId))
      yield put(
        actions.checkAuthTimeout(
          (expirationDate.getTime() - new Date().getTime()) / 1000
        )
      )
    }
  }
}
