
import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
// import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
// import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
const AWSXRay = require('aws-xray-sdk');

const XAWS = AWSXRay.captureAWS(AWS)

// const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic

export class TodosAccess{
    constructor(
        private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
        private readonly userIdIndex = process.env.USER_INDEX,
        private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION,
        private readonly s3 = new AWS.S3({
            signatureVersion: 'v4'
        })
    ){}

    async getToDos(userId: string){
        const todos = await this.docClient.query({
            TableName: this.todoTable,
            IndexName: this.userIdIndex,
            KeyConditionExpression: 'userId = :userId', // provide specific value  for partition key
            ExpressionAttributeValues: {
                ':userId': userId
            }
        }
        ).promise()

        return todos
    }

    async createTodos(newTodo: TodoItem): Promise <TodoItem>{ 
        await this.docClient.put({
            TableName: this.todoTable, 
            Item: newTodo
        }).promise()
        
        return newTodo
    }

    async updateTodos(updatedTodo: TodoUpdate, todoId: string, userId: string): Promise <TodoUpdate>{
        await this.docClient.update({
            TableName: this.todoTable,
            Key: {userId, todoId}, 
            UpdateExpression: 'set #N=:name, #d=:dueDate, #c=:done',
            ExpressionAttributeNames: { '#N': 'name', '#d':'dueDate', '#c':'done'},
            ExpressionAttributeValues:{
                ":name": updatedTodo.name,
                ":dueDate": updatedTodo.dueDate,
                ":done": updatedTodo.done
            },
            ReturnValues: "UPDATED_NEW"
        }).promise()

        return updatedTodo
    }

    async deleteTodo(todoId: string, userId: string){
        await this.docClient.delete({
            TableName: this.todoTable,
            Key: {todoId, userId}
        }).promise()
    }

    async generateUploadUrl(todoId: string, userId: string): Promise <string>{
        const uploadUrl = this.s3.getSignedUrl("putObject", {
            Bucket: this.bucketName,
            Key: todoId,
            Expires: parseInt(this.urlExpiration)
        });
        await this.docClient.update({
            TableName: this.todoTable, 
            Key: {userId, todoId},
            UpdateExpression: "set attachmentUrl=:URL",
            ExpressionAttributeValues:{
                ":URL": uploadUrl.split("?")[0]
            }
        }).promise()
        return uploadUrl
    } 
}