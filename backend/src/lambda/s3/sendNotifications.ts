import { S3Handler, S3Event } from 'aws-lambda'

import 'source-map-support/register'
// import * as middy from 'middy'

import * as AWS from 'aws-sdk'

import { createLogger } from '../../utils/logger'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

// const AWSXRAY = require('aws-xray-sdk');

// const XAWS = AWSXRAY.captureAWS(AWS)

const logger = createLogger('send-notifications')

const docClient: DocumentClient = new AWS.DynamoDB.DocumentClient();

const connectionsTable = process.env.CONNECTIONS_TABLE
const stage = process.env.STAGE
const apiId = process.env.API_ID

const connectionParams = {
    apiVersion: "2018-11-29",
    endpoint: `${apiId}.execute-api.ap-southeast-1.amazonaws.com/${stage}`
}

const apiGateway = new AWS.ApiGatewayManagementApi(connectionParams)

export const handler: S3Handler = async(event: S3Event) => {
        logger.info('Process S3 Upload Notification')
        for (const record of event.Records){
            const key = record.s3.object.key
            console.log('Processing S3 item with key: ', key)
            const connections = await docClient.scan({
                TableName: connectionsTable
            }).promise()
    
            const payload = {
                imageId: key
            }
            for( const connection of connections.Items){
                const connectionId = connection.id
                await sendMessageToClient(connectionId, payload)
            }
        }
    }
    

async function sendMessageToClient(connectionId, payload){
    try{
        console.log('Sending message to a connection', connectionId)

        await apiGateway.postToConnection({
            ConnectionId: connectionId, 
            Data: JSON.stringify(payload)
        }).promise()
    }
    catch(e){
        console.log("Fail to send message", JSON.stringify(e))
        if(e.statusCode === 410){
            console.log('Stale connection')
            await docClient.delete({
                TableName: connectionsTable, 
                Key:{
                    id: connectionId
                }
            }).promise()
        }
    }
}