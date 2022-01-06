import { gql } from "@apollo/client";

const LIST_USER_DOCUMENTS = gql`
    # Retrieves documents owned by user.
    query ($user: String!) {
        documents(user: $user) {
            _id
            name
            users
            type
        }
    }
`;

const CREATE_DOCUMENT = gql`
    # Creates new document and returns the id and name.
    mutation CreateDoc($name: String!, $users: [String], $type: String) {
        createDoc(name: $name, users: $users, type: $type) {
            _id
            name
        }
    }
`;

const OPEN_DOCUMENT = gql`
    # Retrieves documents owned by user.
    query OpenDoc($docid: ID!) {
        openDoc(docid: $docid) {
            _id
            data
            comments
            type
        }
    }
`;

const UPDATE_DOCUMENT = gql`
    # Updates document and returns the new document.
    mutation UpdateDoc($docid: ID!, $data: String! $comments: [String], $type: String) {
        updateDoc(docid: $docid, data: $data, comments: $comments, type: $type) {
            _id
            users
            data
            comments
            type
        }
    }
`;

const RESET_DB = gql`
    # Retrieves documents owned by user.
    query {
        resetDocs {
            deletedCount
        }
    }
`;

const DELETE_DOCUMENT = gql`
    # DELETES a document and returns true if deleted or not found, and false if error.
    mutation DeleteDoc($docid: ID!) {
        deleteDoc(docid: $docid)
    }
`;

export { LIST_USER_DOCUMENTS, CREATE_DOCUMENT, OPEN_DOCUMENT, UPDATE_DOCUMENT, RESET_DB, DELETE_DOCUMENT };
