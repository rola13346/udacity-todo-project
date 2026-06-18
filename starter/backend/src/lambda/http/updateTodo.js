import middy from '@middy/core'
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import createError from 'http-errors'
import { updateTodo as updateTodoItem } from '../../businessLogic/todos.mjs'
import { getUserId } from '../utils.mjs'
import { createLogger } from '../../utils/logger.mjs'

const logger = createLogger('updateTodo')

function validateUpdateTodoRequest(request) {
  if (!request || typeof request !== 'object') {
    throw new createError.BadRequest('Request body is required')
  }

  if (typeof request.name !== 'string') {
    throw new createError.BadRequest('name is required')
  }

  if (typeof request.dueDate !== 'string') {
    throw new createError.BadRequest('dueDate is required')
  }

  if (typeof request.done !== 'boolean') {
    throw new createError.BadRequest('done must be boolean')
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
    const todoId = event.pathParameters.todoId
    const updatedTodo = JSON.parse(event.body)
    validateUpdateTodoRequest(updatedTodo)

    const userId = getUserId(event)

    if (!userId) {
      throw new createError.Unauthorized('Invalid user token')
    }

    logger.info('Updating todo', {
      userId,
      todoId,
      updatedTodo
    })

    try {
      await updateTodoItem(userId, todoId, updatedTodo)

      logger.info('UpdateTodo request succeeded', {
        userId,
        todoId,
        statusCode: 204
      })

      return {
        statusCode: 204,
        body: ''
      }
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') {
        logger.error('UpdateTodo request failed: todo not found', {
          userId,
          todoId
        })
        throw new createError.NotFound(`Todo ${todoId} not found`)
      }

      logger.error('UpdateTodo request failed', {
        userId,
        todoId,
        updatedTodo,
        errorName: error.name,
        errorMessage: error.message,
        stack: error.stack
      })
      throw error
    }
  })