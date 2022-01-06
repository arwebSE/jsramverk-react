import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import * as queries from "../graphql/queries";
require("dotenv").config();

let apiUrl;
if (process.env.NODE_ENV === "development") {
    console.log("=> Dev Mode!");
    apiUrl = "http://localhost:1337";
} else {
    apiUrl = process.env.API_URL;
}

const initApollo = async (accessToken) => {
    const httpLink = createHttpLink({ uri: `${apiUrl}/graphql` });
    const authLink = setContext((_, { headers }) => {
        const token = accessToken;
        return {
            headers: {
                ...headers,
                "Content-Type": "application/json",
                authorization: token ? `Bearer ${token}` : "",
            },
        };
    });

    return new ApolloClient({
        link: authLink.concat(httpLink),
        cache: new InMemoryCache(),
    });
};

const listUserDocs = async (apolloRef, username) => {
    console.log("=> Requesting to list docs for user:", username);
    if (apolloRef) {
        return apolloRef
            .query({
                query: queries.LIST_USER_DOCUMENTS,
                variables: { user: username },
            })
            .then((result) => {
                const docs = result.data.documents;
                console.log("<= Received docs list:", docs);
                return docs;
            })
            .catch((error) => {
                console.error("Error getting docs!", error);
                return;
            });
    }
    return;
};

const createDocument = async (apolloRef, name, users, type) => {
    console.log("=> Sending request to create doc with name:", name, "users:", users, "type", type);
    if (apolloRef) {
        return apolloRef
            .mutate({
                mutation: queries.CREATE_DOCUMENT,
                variables: { name, users, type },
            })
            .then((result) => {
                const data = result.data.createDoc;
                console.log("<= Received created document with name:", data.name, "id:", data._id);
                return data._id;
            })
            .catch((error) => {
                console.error("Error creating doc!", error);
                return;
            });
    }
    return;
};

const deleteDocument = async (apolloRef, docid) => {
    console.log("=> Sending request to delete doc:", docid);
    if (apolloRef) {
        return apolloRef
            .mutate({
                mutation: queries.DELETE_DOCUMENT,
                variables: { docid },
            })
            .then((result) => {
                const data = result.data.deleteDoc;
                console.log("<= Received delete document status:", data);
                return data;
            })
            .catch((error) => {
                console.error("Error creating doc!", error);
                return;
            });
    }
    return;
};

const openDocument = async (apolloRef, docid) => {
    console.log("=> Requesting to open doc:", docid);
    if (apolloRef) {
        return apolloRef
            .query({
                query: queries.OPEN_DOCUMENT,
                variables: { docid },
            })
            .then((result) => {
                const results = result.data.openDoc;
                const data = JSON.parse(results.data);
                const comments = results.comments;
                console.log("<= Response to openDoc query:", result);

                let doc = {};
                for (var k in results) doc[k] = results[k];

                if (data === null) {
                    doc.data = "";
                    console.log("<= Fetched document is empty.");
                } else {
                    console.log("<= Received initial content:", data);
                    doc.data = data;
                }
                if (comments === null || comments.length === 0) {
                    console.log("<= No stored comments received.");
                    doc.comments = [];
                } else {
                    doc.comments = comments.map((comment) => (comment = JSON.parse(comment)));
                    console.log("<= Received comments:", doc.comments);
                }
                return doc;
            })
            .catch((error) => {
                console.error("Error getting doc!", error);
                return "refresh";
            });
    }
    return;
};

export { initApollo, listUserDocs, createDocument, deleteDocument, openDocument };
