import { APIGatewayProxyHandler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as AWS from 'aws-sdk'

import * as middy from 'middy'

import { createLogger } from '../../utils/logger'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const AWSXRAY = require('aws-xray-sdk');

const XAWS = AWSXRAY.captureAWS(AWS)

const logger = createLogger('connect')

const docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient();

const connectionTable = process.env.CONNECTIONS_TABLE

export const handler: APIGatewayProxyHandler = middy(
    async (event: APIGatewayProxyEvent): Promise <APIGatewayProxyResult> => {
        console.log('Websocket disconnect', event)
        logger.info('Websocket disconnect', event)

        const connectionId = event.requestContext.connectionId

        const key = {
            id: connectionId, 
        }
        console.log('Removing item with key', key)
        await docClient.delete({
            TableName: connectionTable, 
            Key: key
        }).promise()
        return {
            statusCode: 200,
            body: ''
        }
    }
)