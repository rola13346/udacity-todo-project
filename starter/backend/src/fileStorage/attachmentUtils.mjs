import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import AWSXRay from 'aws-xray-sdk-core'
import { createLogger } from '../utils/logger.mjs'

const logger = createLogger('attachmentUtils')

const xrayCaptureAWSv3Client =
  AWSXRay.captureAWSv3Client ?? ((client) => client)

const s3Client = xrayCaptureAWSv3Client(new S3Client({}))

const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = parseInt(process.env.SIGNED_URL_EXPIRATION, 10)

export async function getUploadUrl(todoId) {
  logger.info('Generating upload URL', { todoId, bucketName })

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: todoId
  })

  return getSignedUrl(s3Client, command, {
    expiresIn: urlExpiration
  })
}

export async function getDownloadUrl(todoId) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: todoId
  })

  return getSignedUrl(s3Client, command, {
    expiresIn: urlExpiration
  })
}

export function getAttachmentUrl(todoId) {
  return todoId
}