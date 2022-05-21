import { TodosAccess } from '../dataLayer/todosAcess';
// import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
// import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'

const todoAccess = new TodosAccess()

// TODO: Implement businessLogic
export async function createTodo(newTodo: CreateTodoRequest, userId: string) {
    const todoId = uuid.v4()
    const timestamp = new Date().toISOString()  
    const newItem = {
        userId: userId, 
        todoId: todoId,
        createdAt: timestamp, 
        done: false,
        ... newTodo
    }
    return todoAccess.createTodos(newItem)
}

export async function updateTodo(itemToUpdate: UpdateTodoRequest, todoId: string, userId: string){
    return todoAccess.updateTodos(itemToUpdate, todoId, userId);
}

export async function deleteTodo(todoId: string, userId: string){
    return todoAccess.deleteTodo(todoId, userId)
} 

export async function getUploadUrl(todoId: string, userId: string){
    return todoAccess.generateUploadUrl(todoId, userId)
}
export async function getTodos(userId: string) {
    return todoAccess.getToDos(userId)
  }
  