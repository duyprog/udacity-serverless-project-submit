import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { createLogger } from '../../utils/logger'
import { getTodos } from '../../businessLogic/todos'
import { getUserId } from '../utils';
const logger = createLogger('getTodos')

// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    logger.info('Processing getTodos event', { event })

    const todos = await getTodos(getUserId(event))
    const items = todos.Items
    return{
      statusCode: 200, 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        items
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
