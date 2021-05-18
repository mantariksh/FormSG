import { ParamsDictionary, RequestHandler } from 'express-serve-static-core'
import { StatusCodes } from 'http-status-codes'

import { AuthType } from '../../../types'
import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'
import * as FormService from '../form/form.service'

import { sgidService } from './sgid.service'

const logger = createLoggerWithLabel(module)

export const handleLogin: RequestHandler<
  ParamsDictionary,
  unknown,
  unknown,
  { code: string; state: string }
> = async (req, res) => {
  const { code, state } = req.query
  const meta = { action: 'handleLogin', code, state }

  const parsedState = sgidService.parseState(state)

  if (parsedState.isErr()) {
    logger.error({
      message: 'Invalid state sent from sgID',
      meta,
      error: parsedState.error,
    })
    return res.sendStatus(StatusCodes.BAD_REQUEST)
  }

  const { formId, rememberMe } = parsedState.value
  const formResult = await FormService.retrieveFullFormById(formId)
  if (formResult.isErr()) {
    logger.error({
      message: 'Form not found',
      meta,
      error: formResult.error,
    })
    return res.sendStatus(StatusCodes.NOT_FOUND)
  }

  const form = formResult.value
  if (form.authType !== AuthType.SGID) {
    logger.error({
      message: "Log in attempt to wrong endpoint for form's authType",
      meta: {
        ...meta,
        formAuthType: form.authType,
        endpointAuthType: AuthType.SGID,
      },
    })
    res.cookie('isLoginError', true)
    return res.redirect(`/${formId}`)
  }

  const jwtResult = await sgidService
    .token(code)
    .andThen((data) => sgidService.userInfo(data))
    .andThen(({ data }) => sgidService.createJWT(data, rememberMe))

  if (jwtResult.isErr()) {
    logger.error({
      message: 'Error while handling login via sgID',
      meta,
      error: jwtResult.error,
    })
    res.cookie('isLoginError', true)
    return res.redirect(`/${formId}`)
  }

  const { maxAge, jwt } = jwtResult.value
  res.cookie('jwtSgid', jwt, {
    maxAge,
    httpOnly: false, // the JWT needs to be read by client-side JS
    sameSite: 'lax', // Setting to 'strict' prevents Singpass login on Safari, Firefox
    secure: !config.isDev,
    ...sgidService.getCookieSettings(),
  })
  return res.redirect(`/${formId}`)
}
