import { JwtRsaVerifier } from 'aws-jwt-verify'

const logger = {
  info(message, meta = {}) {
    console.log(
      JSON.stringify({
        level: 'info',
        message,
        name: 'auth',
        ...meta
      })
    )
  },
  error(message, meta = {}) {
    console.error(
      JSON.stringify({
        level: 'error',
        message,
        name: 'auth',
        ...meta
      })
    )
  }
}

const verifier = JwtRsaVerifier.create({
  issuer: process.env.AUTH0_ISSUER,
  audience: process.env.AUTH0_AUDIENCE,
  jwksUri: process.env.AUTH0_JWKS_URL
})

export const handler = async (event) => {
  logger.info('Processing authorizer event', {
    hasAuthorizationToken: !!event.authorizationToken
  })

  try {
    const token = getToken(event.authorizationToken)
    const decodedJwt = await verifier.verify(token)

    logger.info('User was authorized', {
      sub: decodedJwt.sub
    })

    return generatePolicy(decodedJwt.sub, 'Allow', event.methodArn)
  } catch (error) {
    logger.error('User was not authorized', {
      errorMessage: error.message,
      errorName: error.name
    })

    throw new Error('Unauthorized')
  }
}

function getToken(authHeader) {
  if (!authHeader) {
    throw new Error('No authentication header')
  }

  if (!authHeader.toLowerCase().startsWith('bearer ')) {
    throw new Error('Invalid authentication header')
  }

  return authHeader.split(' ')[1]
}

function generatePolicy(principalId, effect, methodArn) {
  const arnParts = methodArn.split(':')
  const apiGatewayArnPart = arnParts[5]
  const apiGatewayArnParts = apiGatewayArnPart.split('/')
  const awsAccountId = arnParts[4]
  const region = arnParts[3]
  const restApiId = apiGatewayArnParts[0]
  const stage = apiGatewayArnParts[1]

  const wildcardResource = `arn:aws:execute-api:${region}:${awsAccountId}:${restApiId}/${stage}/*/*`

  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: wildcardResource
        }
      ]
    }
  }
}