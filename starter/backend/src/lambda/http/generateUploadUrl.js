import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { createAttachmentPresignedUrl } from '../../businessLogic/todos.mjs'
import { getUserId } from '../utils.mjs'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('generateUploadUrl')

export const handler = middy()
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
  .handler(async (event) => {
    const todoId = event.pathParameters.todoId
    const userId = getUserId(event)

    if (!userId) {
      throw new createError.Unauthorized('Invalid user token')
    }

    logger.info('Generating upload URL', {
      userId,
      todoId
    })

    try {
      const uploadUrl = await createAttachmentPresignedUrl(userId, todoId)

      logger.info('GenerateUploadUrl request succeeded', {
        userId,
        todoId,
        statusCode: 200
      })

      return {
        statusCode: 200,
        body: JSON.stringify({
          uploadUrl
        })
      }
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        logger.error('GenerateUploadUrl request failed: todo not found', {
          userId,
          todoId
        })
        throw new createError.NotFound(`Todo ${todoId} not found`)
      }

      logger.error('GenerateUploadUrl request failed', {
        userId,
        todoId,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      })
      throw error
    }
  })