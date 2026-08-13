import { gql } from '@apollo/client';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import type { AppUser, GoalStatus, Note, Response } from '@/contexts/UserContext';

type CreateUserData = { regUser: Pick<AppUser, 'email' | 'firstName' | 'lastName' | 'createdAt'> };
type CreateUserVars = { username: string; email: string };
export const CREATE_USER: TypedDocumentNode<CreateUserData, CreateUserVars> = gql`
  mutation CreateUser($username: String!, $email: String!) {
    regUser(username: $username, email: $email) {
        email
        firstName
        lastName
        createdAt
    }
}`;

type DeleteUserData = { deleteUser: { success: boolean; message: string; id: number } };
type DeleteUserVars = { id: number };
export const DELETE_USER: TypedDocumentNode<DeleteUserData, DeleteUserVars> = gql`
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id) {
      success
      message
      id
  }
}`;

type GetUserData = { user: AppUser | null };
type GetUserVars = { id?: number; email?: string; username?: string };
export const GET_USER: TypedDocumentNode<GetUserData, GetUserVars> = gql`
  query GetUser($id: Int, $email: String, $username: String) {
    user(id: $id, email: $email, username: $username) {
      id
      email
      username
      firstName
      lastName
      feeling
      createdAt
      updatedAt
      notes {
        id
        createdAt
        updatedAt
        content
      }
      goals {
        content
        createdAt
        dueDate
        id
        status
        updatedAt
      }
      questions {
        id
        authorId
        authorName
        body
        createdAt
        updatedAt
        responses {
          id
          authorId
          questionId
          body
          createdAt
          updatedAt
        }
      }
  }
}`;

type UpdateUserData = { updateUser: Pick<AppUser, 'id' | 'email' | 'username' | 'firstName' | 'lastName' | 'createdAt' | 'updatedAt' | 'feeling'> };
type UpdateUserVars = { id: number; username?: string; email?: string; firstName?: string; lastName?: string; feeling?: string };
export const UPDATE_USER: TypedDocumentNode<UpdateUserData, UpdateUserVars> = gql`
  mutation UpdateUser($id: Int!, $username: String, $email: String, $firstName: String, $lastName: String, $feeling: String) {
    updateUser(id: $id, username: $username, email: $email, firstName: $firstName, lastName: $lastName, feeling: $feeling) {
      id
      email
      username
      firstName
      lastName
      createdAt
      updatedAt
      feeling
  }
}`;

type AddNoteData = { addNote: Note };
type AddNoteVars = { authorId: number; content: string };
export const ADD_NOTE: TypedDocumentNode<AddNoteData, AddNoteVars> = gql`
  mutation AddNote($authorId: Int!, $content: String!) {
    addNote(authorId: $authorId, content: $content) {
      id
      content
      createdAt
      updatedAt
  }
}`;

type UpdateNoteData = { updateNote: Note };
type UpdateNoteVars = { updateNoteId: number; content?: string };
export const UPDATE_NOTE: TypedDocumentNode<UpdateNoteData, UpdateNoteVars> = gql`
  mutation UpdateNote($updateNoteId: Int!, $content: String) {
    updateNote(id: $updateNoteId, content: $content) {
      id
      content
      createdAt
      updatedAt
    }
  }
`;

type DeleteNoteData = { deleteNote: { success: boolean; message: string; id: number } };
type DeleteNoteVars = { deleteNoteId: number };
export const DELETE_NOTE: TypedDocumentNode<DeleteNoteData, DeleteNoteVars> = gql`
  mutation DeleteNote($deleteNoteId: Int!) {
    deleteNote(id: $deleteNoteId) {
      success
      message
      id
    }
  }
`;

type AddGoalData = { addGoal: { id: number; content: string; status: string; createdAt: Date; dueDate?: Date; updatedAt: Date } };
type AddGoalVars = { userId: number; content: string; dueDate: Date };
export const ADD_GOAL: TypedDocumentNode<AddGoalData, AddGoalVars> = gql`
  mutation AddGoal($userId: Int!, $content: String!, $dueDate: DateTime!) {
    addGoal(userId: $userId, content: $content, dueDate: $dueDate) {
      id
      content
      status
      createdAt
      dueDate
      updatedAt
    }
  }
`;

type DeleteGoalData = { deleteGoal: { success: boolean; message: string; id: number } };
type DeleteGoalVars = { deleteGoalId: number };
export const DELETE_GOAL: TypedDocumentNode<DeleteGoalData, DeleteGoalVars> = gql`
  mutation DeleteGoal($deleteGoalId: Int!) {
    deleteGoal(id: $deleteGoalId) {
      success
      message
      id
    }
  }
`;

type UpdateGoalData = { updateGoal: { id: number; content: string; status: string; createdAt: Date; dueDate?: Date; updatedAt: Date } };
type UpdateGoalVars = { updateGoalId: number; content?: string; status?: GoalStatus; dueDate?: Date };
export const UPDATE_GOAL: TypedDocumentNode<UpdateGoalData, UpdateGoalVars> = gql`
  mutation UpdateGoal($updateGoalId: Int!, $content: String, $status: GoalStatus, $dueDate: DateTime) {
    updateGoal(id: $updateGoalId, content: $content, status: $status, dueDate: $dueDate) {
      id
      content
      status
      createdAt
      dueDate
      updatedAt
    }
  }
`;

type AddQuestionData = { addQuestion: { id: number; authorId: number; body: string; createdAt: Date; updatedAt: Date; responses: Response[] } };
type AddQuestionVars = { authorId: number; body: string };
export const ADD_QUESTION: TypedDocumentNode<AddQuestionData, AddQuestionVars> = gql`
  mutation AddQuestion($authorId: Int!, $body: String!) {
    addQuestion(authorId: $authorId, body: $body) {
      id
      authorId
      authorName
      body
      createdAt
      updatedAt
      responses {
        id
        authorId
        questionId
        body
        createdAt
        updatedAt
      }
    }
  }
`;