import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { getTodosForUser } from '../../businessLogic/todos.mjs'
import { getUserId } from '../utils.mjs'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('getTodos')

export const handler = middy()
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
  .handler(async (event) => {
    const userId = getUserId(event)

    if (!userId) {
      throw new createError.Unauthorized('Invalid user token')
    }

    logger.info('Getting todos for current user', {
      userId
    })

    try {
      const items = await getTodosForUser(userId)

      logger.info('GetTodos request succeeded', {
        userId,
        itemCount: items.length,
        statusCode: 200
      })

      return {
        statusCode: 200,
        body: JSON.stringify({
          items
        })
      }
    } catch (error) {
      logger.error('GetTodos request failed', {
        userId,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      })
      throw error
    }
  })