import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { createTodo as createTodoItem } from '../../businessLogic/todos.mjs'
import { getUserId } from '../utils.mjs'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('createTodo')

function validateCreateTodoRequest(request) {
  if (!request || typeof request !== 'object') {
    throw new createError.BadRequest('Request body is required')
  }

  if (!request.name || typeof request.name !== 'string') {
    throw new createError.BadRequest('name is required')
  }

  if (!request.dueDate || typeof request.dueDate !== 'string') {
    throw new createError.BadRequest('dueDate is required')
  }
}

export const handler = middy()
  .use(httpErrorHandler())
  .use(
    cors({
      credentials: true
    })
  )
  .handler(async (event) => {
    const newTodo = JSON.parse(event.body)
    validateCreateTodoRequest(newTodo)

    const userId = getUserId(event)

    if (!userId) {
      throw new createError.Unauthorized('Invalid user token')
    }

    logger.info('Creating a new todo', {
      userId,
      newTodo
    })

    const item = await createTodoItem(userId, newTodo)

    return {
      statusCode: 201,
      body: JSON.stringify({
        item
      })
    }
  })