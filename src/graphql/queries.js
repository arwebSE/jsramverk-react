import { gql } from "@apollo/client";

const LIST_USER_DOCUMENTS = gql`
# Retrieves documents owned by user.
query ($user: String!) {
    documents(user: $user) {
        _id
        name
    }
}
`;

const CREATE_DOCUMENT = gql`
# Creates new document and returns the id and name.
mutation CreateDoc($name: String!, $users: [String]) {
    createDoc(name: $name, users: $users) {
        _id
        name
    }
}
`;

const OPEN_DOCUMENT = gql`
# Retrieves documents owned by user.
query ($docid: ID!) {
    openDoc(docid: $docid) {
        _id
        data
    }
}
`;

const UPDATE_DOCUMENT = gql`
# Updates document and returns the new document.
mutation UpdateDoc($docid: ID!, $data: String!) {
    updateDoc(docid: $docid, data: $data) {
        _id
        users
        data
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


export {
    LIST_USER_DOCUMENTS,
    CREATE_DOCUMENT,
    OPEN_DOCUMENT,
    UPDATE_DOCUMENT,
    RESET_DB
}
