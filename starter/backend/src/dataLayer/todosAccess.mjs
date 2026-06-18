import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  QueryCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand
} from '@aws-sdk/lib-dynamodb'
import AWSXRay from 'aws-xray-sdk-core'
import { createLogger } from '../utils/logger.mjs'

const logger = createLogger('TodosAccess')

const xrayCaptureAWSv3Client =
  AWSXRay.captureAWSv3Client ?? ((client) => client)

const dynamoDbClient = xrayCaptureAWSv3Client(new DynamoDBClient({}))
const docClient = DynamoDBDocumentClient.from(dynamoDbClient)

const todosTable = process.env.TODOS_TABLE
const todosCreatedAtIndex = process.env.TODOS_CREATED_AT_INDEX

export class TodosAccess {
  async getTodos(userId) {
    logger.info('Getting todos for user', { userId, table: todosTable, index: todosCreatedAtIndex })

    try {
      const result = await docClient.send(
        new QueryCommand({
          TableName: todosTable,
          IndexName: todosCreatedAtIndex,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
            ':userId': userId
          }
        })
      )

      logger.info('Successfully retrieved todos', {
        userId,
        itemCount: result.Items?.length ?? 0
      })

      return result.Items ?? []
    } catch (error) {
      logger.error('Failed to query todos from DynamoDB', {
        userId,
        table: todosTable,
        index: todosCreatedAtIndex,
        errorName: error.name,
        errorMessage: error.message
      })
      throw error
    }
  }

  async createTodo(todoItem) {
    logger.info('Creating todo item', {
      todoId: todoItem.todoId,
      userId: todoItem.userId
    })

    try {
      await docClient.send(
        new PutCommand({
          TableName: todosTable,
          Item: todoItem
        })
      )

      logger.info('Successfully created todo item', {
        todoId: todoItem.todoId,
        userId: todoItem.userId
      })

      return todoItem
    } catch (error) {
      logger.error('Failed to write new todo item to DynamoDB', {
        todoId: todoItem.todoId,
        userId: todoItem.userId,
        table: todosTable,
        errorName: error.name,
        errorMessage: error.message
      })
      throw error
    }
  }

  async updateTodo(userId, todoId, updateTodoRequest) {
    logger.info('Updating todo item', {
      userId,
      todoId
    })

    try {
      await docClient.send(
        new UpdateCommand({
          TableName: todosTable,
          Key: {
            userId,
            todoId
          },
          UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
          ConditionExpression: 'attribute_exists(todoId)',
          ExpressionAttributeNames: {
            '#name': 'name'
          },
          ExpressionAttributeValues: {
            ':name': updateTodoRequest.name,
            ':dueDate': updateTodoRequest.dueDate,
            ':done': updateTodoRequest.done
          }
        })
      )

      logger.info('Successfully updated todo item', { userId, todoId })
    } catch (error) {
      logger.error('Failed to update todo item in DynamoDB', {
        userId,
        todoId,
        table: todosTable,
        errorName: error.name,
        errorMessage: error.message
      })
      throw error
    }
  }

  async deleteTodo(userId, todoId) {
    logger.info('Deleting todo item', {
      userId,
      todoId
    })

    try {
      await docClient.send(
        new DeleteCommand({
          TableName: todosTable,
          Key: {
            userId,
            todoId
          }
        })
      )

      logger.info('Successfully deleted todo item', { userId, todoId })
    } catch (error) {
      logger.error('Failed to delete todo item from DynamoDB', {
        userId,
        todoId,
        table: todosTable,
        errorName: error.name,
        errorMessage: error.message
      })
      throw error
    }
  }

  async updateAttachmentUrl(userId, todoId, attachmentUrl) {
    logger.info('Updating attachment URL', {
      userId,
      todoId,
      attachmentUrl
    })

    try {
      await docClient.send(
        new UpdateCommand({
          TableName: todosTable,
          Key: {
            userId,
            todoId
          },
          UpdateExpression: 'set attachmentUrl = :attachmentUrl',
          ConditionExpression: 'attribute_exists(todoId)',
          ExpressionAttributeValues: {
            ':attachmentUrl': attachmentUrl
          }
        })
      )

      logger.info('Successfully updated attachment URL', { userId, todoId })
    } catch (error) {
      logger.error('Failed to update attachment URL in DynamoDB', {
        userId,
        todoId,
        table: todosTable,
        errorName: error.name,
        errorMessage: error.message
      })
      throw error
    }
  }
}