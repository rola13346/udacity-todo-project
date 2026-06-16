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
    logger.info('Getting todos for user', { userId })

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

    return result.Items ?? []
  }

  async createTodo(todoItem) {
    logger.info('Creating todo item', {
      todoId: todoItem.todoId,
      userId: todoItem.userId
    })

    await docClient.send(
      new PutCommand({
        TableName: todosTable,
        Item: todoItem
      })
    )

    return todoItem
  }

  async updateTodo(userId, todoId, updateTodoRequest) {
    logger.info('Updating todo item', {
      userId,
      todoId
    })

    await docClient.send(
      new UpdateCommand({
        TableName: todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: 'set #name = :name, dueDate = :dueDate, done = :done',
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
  }

  async deleteTodo(userId, todoId) {
    logger.info('Deleting todo item', {
      userId,
      todoId
    })

    await docClient.send(
      new DeleteCommand({
        TableName: todosTable,
        Key: {
          userId,
          todoId
        }
      })
    )
  }

  async updateAttachmentUrl(userId, todoId, attachmentUrl) {
    logger.info('Updating attachment URL', {
      userId,
      todoId,
      attachmentUrl
    })

    await docClient.send(
      new UpdateCommand({
        TableName: todosTable,
        Key: {
          userId,
          todoId
        },
        UpdateExpression: 'set attachmentUrl = :attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': attachmentUrl
        }
      })
    )
  }
}