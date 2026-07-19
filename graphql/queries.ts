import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $email: String!) {
    regUser(username: $username, email: $email) {
        email
        firstName
        lastName
        createdAt
    }
}`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: Int!) {
    deleteUser(id: $id) {
      success
      message
      id
  }
}`;

export const GET_USER = gql`
  query GetUser($id: Int, $email: String, $username: String) {
    user(id: $id, email: $email, username: $username) {
      id
      email
      username
      firstName
      lastName
      createdAt
      updatedAt
  }
}`;

export const UPDATE_USER = gql`
  mutation UpdateUser($id: Int!, $username: String, $email: String, $firstName: String, $lastName: String) {
    updateUser(id: $id, username: $username, email: $email, firstName: $firstName, lastName: $lastName) {
      id
      email
      username
      firstName
      lastName
      createdAt
      updatedAt
  }
}`;