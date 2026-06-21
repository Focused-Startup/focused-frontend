import { gql } from '@apollo/client';

export const CREATE_USER = gql`
  mutation CreateUser($username: String!, $email: String!, $password: String!) {
    regUser(username: $username, email: $email, password: $password) {
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