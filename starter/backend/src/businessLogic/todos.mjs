import { v4 as uuidv4 } from 'uuid'
import { TodosAccess } from '../dataLayer/todosAccess.mjs'
import { createLogger } from '../utils/logger.mjs'
import {
  getUploadUrl,
  getAttachmentUrl,
  getDownloadUrl
} from '../fileStorage/attachmentUtils.mjs'

const logger = createLogger('todos')
const todosAccess = new TodosAccess()

export async function getTodosForUser(userId) {
  logger.info('Getting todos for user', { userId })

  const items = await todosAccess.getTodos(userId)

  return Promise.all(
    items.map(async (item) => {
      if (!item.attachmentUrl) {
        return item
      }

      return {
        ...item,
        attachmentUrl: await getDownloadUrl(item.todoId)
      }
    })
  )
}

export async function createTodo(userId, createTodoRequest) {
  const todoId = uuidv4()
  const createdAt = new Date().toISOString()

  const newTodoItem = {
    userId,
    todoId,
    createdAt,
    name: createTodoRequest.name,
    dueDate: createTodoRequest.dueDate,
    done: false,
    attachmentUrl: ''
  }

  logger.info('Creating new todo item', {
    userId,
    todoId
  })

  return todosAccess.createTodo(newTodoItem)
}

export async function updateTodo(userId, todoId, updateTodoRequest) {
  logger.info('Updating todo item', {
    userId,
    todoId
  })

  await todosAccess.updateTodo(userId, todoId, updateTodoRequest)
}

export async function deleteTodo(userId, todoId) {
  logger.info('Deleting todo item', {
    userId,
    todoId
  })

  await todosAccess.deleteTodo(userId, todoId)
}

export async function createAttachmentPresignedUrl(userId, todoId) {
  logger.info('Creating attachment upload URL', {
    userId,
    todoId
  })

  const uploadUrl = await getUploadUrl(todoId)
  const attachmentUrl = getAttachmentUrl(todoId)

  await todosAccess.updateAttachmentUrl(userId, todoId, attachmentUrl)

  return uploadUrl
}