import jwt from 'jsonwebtoken'

export function parseUserId(jwtToken) {
  const decodedJwt = jwt.decode(jwtToken)
  return decodedJwt.sub
}

export function getUserId(event) {
  const authorization = event.headers.Authorization || event.headers.authorization
  const split = authorization.split(' ')

  return parseUserId(split[1])
}