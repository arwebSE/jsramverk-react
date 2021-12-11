import React, { Component } from "react";
import ReactQuill from "react-quill";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import "react-quill/dist/quill.snow.css";
import "../styles/editor.scss";
import {
    Modal,
    Button,
    Table,
    InputGroup,
    FormControl,
    Container,
    Alert,
    ToastContainer,
    Toast,
    Dropdown,
} from "react-bootstrap";
import socketIOClient from "socket.io-client";
import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import * as queries from "../graphql/queries";
require("dotenv").config();

let apiUrl;
if (process.env.NODE_ENV === "development") {
    console.log("=> Dev Mode!");
    apiUrl = "http://localhost:1337";
} else {
    apiUrl = "https://jsramverk-editor-auro17.azurewebsites.net";
    //apiUrl = "https://jsramverk-api.arwebse.repl.co";
}
const SAVE_INTERVAL = 10000;
const TOKEN_INTERVAL = 90000;

class Editor extends Component {
    constructor(props) {
        super(props);
        this.quillRef = null; // Quill instance
        this.reactQuillRef = null; // ReactQuill component
        this.socket = null;
        this.interval = false;
        this.timeSinceEdit = new Date();
        this.state = {
            error: null,
            apiLoaded: false,
            documents: [],
            openModalShown: false,
            newModalShown: false,
            editData: null,
            newDocName: null,
            alertShown: false,
            docid: props.match.params.id,
            userChanged: false,
            alertContent: "",
            toastShow: false,
            username: null,
            accessToken: null,
            refreshToken: null,
            allowedUsers: [],
            apollo: null,
        };
    }

    modules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, false] }],
            [{ font: [] }],
            ["bold", "italic", "underline", "strike", "blockquote"],
            [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
            [{ color: [] }, { background: [] }],
            [{ script: "sub" }, { script: "super" }],
            [{ align: [] }],
            ["image", "link", "blockquote", "code-block"],
            ["clean"],
        ],
    };

    formats = [
        "header",
        "background",
        "font",
        "color",
        "align",
        "code-block",
        "script",
        "bold",
        "italic",
        "underline",
        "strike",
        "blockquote",
        "list",
        "bullet",
        "indent",
        "link",
        "image",
    ];

    /* COMPONENT LIFECYCLE */

    async componentDidMount() {
        // Handle username with storage
        if (await this.isLoggedIn()) {
            // Setup auto refresh access token
            this.autoRefreshToken();

            console.log("=> Connecting to API at:", apiUrl);

            // init gql client
            this.initApolloClient();

            // Attaching Quill
            this.attachQuillRefs();

            //this.quillRef.disable();
            this.quillRef.setText("Loading...");

            // Attaching socket
            const sock = socketIOClient(apiUrl);
            this.socket = sock;

            // Refreshing doc list from DB
            await this.firstFetch();
        } else {
            // Username is not set
            console.log("Aborting load.");
            this.props.history.push({ pathname: "/login" });
        }
    }

    componentWillUnmount() {
        if (this.socket !== null) {
            this.socket.disconnect();
            console.log("=> Disconnected from server.");
            this.socket.removeAllListeners();
            console.log("=> Removed all socket listeners.");
            document.removeEventListener("keydown", this.saveKeysHandler); // removes ctrl+s listener
        }
        console.log("intervals:", this.interval);
        if (this.interval) {
            console.log("Clearing interval!", this.interval);
            clearInterval(this.interval);
        }
        if (this.state.apollo !== null) {
            this.setState({ apollo: null });
        }
    }

    componentDidUpdate() {
        this.attachQuillRefs();
    }

    /* HELPER FUNCTIONS */

    initApolloClient = () => {
        const httpLink = createHttpLink({ uri: `${apiUrl}/graphql` });
        const authLink = setContext((_, { headers }) => {
            const token = this.state.accessToken;
            return {
                headers: {
                    ...headers,
                    "Content-Type": "application/json",
                    authorization: token ? `Bearer ${token}` : "",
                },
            };
        });

        const apollo = new ApolloClient({
            link: authLink.concat(httpLink),
            cache: new InMemoryCache(),
        });
        this.setState({ apollo }); // Store apollo ref in state var
    };

    handleUsersInput = (values) => {
        let arr = values.split(",").map(function (item) {
            return item.trim();
        });
        this.setState({ allowedUsers: arr });
    };

    isLoggedIn = async () => {
        console.log("=> Stored username:", localStorage.getItem("username"));
        if (localStorage.getItem("username") === null) {
            console.log("Looking for loc props...", this.props.location.state);
            if (this.props.location.state !== undefined) {
                this.setState({
                    username: this.props.location.state.username,
                    accessToken: this.props.location.state.accessToken,
                    refreshToken: this.props.location.state.refreshToken,
                });
                localStorage.setItem("username", this.props.location.state.username);
                localStorage.setItem("accessToken", this.props.location.state.accessToken); // UNSECURE
                localStorage.setItem("refreshToken", this.props.location.state.refreshToken); // UNSECURE
                console.log(
                    "Got loc props! Set username to:",
                    this.props.location.state.username,
                    "and saved tokens to LS. (unsecure)"
                );
                return true;
            } else {
                console.log("Couldnt get loc props and not logged in. Back to login...", this.state.username);
                this.props.history.push({ pathname: "/login" });
            }
        } else {
            // UNSECURE
            this.setState({
                username: localStorage.getItem("username"),
                accessToken: localStorage.getItem("accessToken"),
                refreshToken: localStorage.getItem("refreshToken"),
            });
            return true;
        }
        return;
    };

    docidExists = (docs, docid) => {
        return docs.some(function (el) {
            return el._id === docid;
        });
    };

    firstFetch = async (docslist = null) => {
        console.log("=> Requesting docs for the first time this cycle.");
        if (docslist === null) {
            // If no docs are loaded, query docs list.
            await this.listDocuments();
        } else if (docslist === false) {
            console.log("=> Failed to fetch docs.");
        } else {
            if (docslist) {
                // Check if document is selected and exists in list.
                let docExists = this.docidExists(docslist, this.state.docid);
                if (this.state.docid === undefined) {
                    console.log("=> No docid in URL / no doc opened.");
                    this.showAlert("Please open or create a document.");
                } else if (docExists) {
                    console.log("=> Document exists! Opening...");
                    this.openDocument(this.state.docid); // Open document based off route
                    document.addEventListener("keydown", this.saveKeysHandler);
                } else {
                    console.log("=> Document doesnt exist!");
                    this.showAlert("The document doesn't exist!");
                }
            } else {
                console.log("=> Failed to init request docs!", docslist);
            }
        }
    };

    listDocuments = async () => {
        console.log("=> Requesting to list docs for user:", this.state.username);

        this.state.apollo
            .query({
                query: queries.LIST_USER_DOCUMENTS,
                variables: { user: this.state.username },
            })
            .then((result) => {
                const docs = result.data.documents;
                this.setState({ documents: docs, apiLoaded: true });
                console.log("<= Recieved docs list:", docs);
                this.firstFetch(docs); // callback
            })
            .catch((error) => {
                console.error("Error getting docs!", error, "Trying to refresh token...");
                this.refreshAccessToken(true);
                this.firstFetch(false); // callback. tell list firstfetch it failed
            });
    };

    attachQuillRefs = () => {
        if (typeof this.reactQuillRef.getEditor !== "function") return;
        this.quillRef = this.reactQuillRef.getEditor();
    };

    receiveChanges() {
        console.log("=> Receive changes called.");
        if (this.socket == null || this.quillRef == null) return;
        console.log("=> Now accepting realtime changes!");
        this.socket.once("receive-changes", (delta) => {
            // DEBUG
            console.log("<= Received changes!", delta);
        });
        this.socket.on("receive-changes", (delta) => {
            this.quillRef.updateContents(delta);
        });
        this.setState({ userChanged: false });
    }

    openDocument = (docid, e = null) => {
        if (e) e.preventDefault();
        if (this.socket == null || this.quillRef == null) {
            console.log("=> socket:", this.socket, "quillref:", this.quillRef);
            return;
        }
        if (docid !== this.props.match.params.id) {
            // if on wrong url
            console.log("=> redirecting to correct url");
            this.props.history.push(`/docs/${docid}`);
        }

        console.log("=> Calling API to send doc:", docid);

        this.state.apollo
            .query({
                query: queries.OPEN_DOCUMENT,
                variables: { docid },
            })
            .then((result) => {
                const docid = result.data.openDoc._id;
                let data = JSON.parse(result.data.openDoc.data);
                console.log("<= Response to openDoc query:", result);
                if (data === null) {
                    data = "";
                    console.log("<= Fetched document is empty.");
                } else {
                    console.log("<= Received initial content:", data);
                }

                this.setState({ docid, userChanged: false }); // important to ignore changes fetched
                this.quillRef.setContents(data, "api");
                this.quillRef.enable();

                this.socket.emit("get-document", docid);
                this.receiveChanges();
                this.autoSave(); // Setup autosave
                this.hideAlert();
            })
            .catch((error) => {
                console.error("Error getting doc!", error);
                this.refreshAccessToken(true);
            });
    };

    createDocument = (name, e = null) => {
        if (e) e.preventDefault();
        if (this.state.username == null) return;

        // Add any additional users if given
        let users = [this.state.username];
        if (this.state.allowedUsers.length > 0) {
            users = users.concat(this.state.allowedUsers);
        }

        console.log("=> sending request to create doc with name:", name, "users:", users);

        this.state.apollo
            .mutate({
                mutation: queries.CREATE_DOCUMENT,
                variables: { name, users },
            })
            .then((result) => {
                const data = result.data.createDoc;
                console.log("<= Received created document with name:", data.name, "id:", data._id);
                console.log("<= Opening it...");
                this.openDocument(data._id);
            })
            .catch((error) => {
                console.error("Error creating doc!", error);
            });
    };

    saveDocument = (e = null) => {
        if (e) e.preventDefault();
        if (this.quillRef == null || this.state.docid === undefined) {
            console.log("=> couldnt save. quillref:", this.quillRef, "docid:", this.state.docid);
            return;
        }

        const data = JSON.stringify(this.quillRef.getContents());
        this.state.apollo
            .mutate({
                mutation: queries.UPDATE_DOCUMENT,
                variables: { docid: this.state.docid, data },
            })
            .then((result) => {
                console.log("=> Saved! data:", this.quillRef.getContents());
                this.setState({ toastShow: true });
            })
            .catch((error) => {
                console.error("Error saving doc!", error);
            });
    };

    autoSave = () => {
        if (this.socket == null || this.quillRef == null) return;

        this.interval = setInterval(() => {
            const elapsed = Date.now() - this.timeSinceEdit;
            if (this.state.userChanged) {
                console.log("=> User has edited! Going to autosave...");
                if (elapsed > SAVE_INTERVAL) {
                    console.log("=> AUTOSAVED!");
                    this.saveDocument();
                    this.setState({ userChanged: false }); // resetting var
                }
            } else {
                console.log("=> Skipping autosave (user hasn't edited)...");
            }
        }, SAVE_INTERVAL);
    };

    saveKeysHandler = (e) => {
        if (e.key === "s" && e.ctrlKey) {
            e.preventDefault();
            this.saveDocument();
        }
    };

    autoRefreshToken = async () => {
        if (this.state.refreshToken == null) return;

        this.interval = setInterval(async () => {
            await this.refreshAccessToken();
        }, TOKEN_INTERVAL);
    };

    refreshAccessToken = async (listAfter) => {
        if (this.state.refreshToken !== null || localStorage.getItem("refreshToken") !== null) {
            console.log("=> Requesting to refresh accessToken...");
            const requestOptions = {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: this.state.refreshToken }),
            };
            fetch(`${apiUrl}/token`, requestOptions)
                .then(async (response) => {
                    const isJson = response.headers.get("content-type")?.includes("application/json");
                    const data = isJson && (await response.json());

                    if (!response.ok) {
                        const error = (data && data.message) || response.status;
                        console.log("Error refreshing token", data);
                        return Promise.reject(error);
                    }
                    console.log("<= Successfully refreshed AccessToken!");
                    this.setState({ accessToken: data.accessToken });
                    localStorage.setItem("accessToken", data.accessToken);
                    if (listAfter) {
                        this.listDocuments();
                    }
                })
                .catch((error) => {
                    console.error("Error refreshing atoken!", error);
                });
        } else {
            console.log("RefreshToken is null!! this shudnt happen");
        }
    };

    handleLogout = (e = null) => {
        if (e) e.preventDefault();
        console.log("Logging out! Deleting LocalStorage...");
        localStorage.clear();
        if (this.state.refreshToken !== null) {
            console.log("Requesting to remove rftoken:", this.state.refreshToken);
            const requestOptions = {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: this.state.username, token: this.state.refreshToken }),
            };
            fetch(`${apiUrl}/logout`, requestOptions)
                .then(async (response) => {
                    const isJson = response.headers.get("content-type")?.includes("application/json");
                    const data = isJson && (await response.json());

                    if (!response.ok) {
                        const error = (data && data.message) || response.status;
                        this.showAlert(data);
                        return Promise.reject(error);
                    }
                    console.log("Successfully removed rftoken!");
                    this.props.history.push({
                        pathname: "/logout",
                    });
                })
                .catch((error) => {
                    console.error("Error logging out!", error);
                });
        } else {
            console.log("RefreshToken not set. Skipping DELETE request.");
            this.props.history.push({
                pathname: "/logout",
            });
        }
    };

    /* MISC FUNCTIONS */

    printEditData = (e = null) => {
        if (e) e.preventDefault();
        console.log("Data:", this.state.editData);
    };

    handleChange = (html, delta, source, editor) => {
        // Making sure socket and Quill are attached
        if (this.socket == null || this.quillRef == null) return;
        if (source !== "user") return; // Prevent changes not made by user
        this.setState({ editData: html, userChanged: true });
        // console.log("Sending changes:", delta); // DEBUG
        this.socket.emit("send-changes", delta);
        this.timeSinceEdit = Date.now(); // set timer to last edit
    };

    resetDB = (e = null) => {
        if (e) e.preventDefault();
        this.state.apollo
            .query({
                query: queries.RESET_DB,
            })
            .then((result) => {
                console.log("<= Deleted", result.data.resetDocs.deletedCount, "entries.");
            })
            .catch((error) => {
                console.error("<= Error resetting DB:", error);
            });
    };

    /* TOGGLES */
    showOpenModal = () => {
        this.listDocuments();
        this.setState({ openModalShown: true });
    };
    hideOpenModal = () => {
        this.setState({ openModalShown: false });
    };
    showNewModal = () => {
        this.setState({ newModalShown: true });
        this.setState({ allowedUsers: [] }); // reset var
    };
    hideNewModal = () => {
        this.setState({ newModalShown: false });
    };
    showAlert = (content) => {
        this.setState({ alertShown: true, alertContent: content });
    };
    hideAlert = () => {
        this.setState({ alertShown: false });
    };
    /* TOGGLES END */

    render() {
        const {
            error,
            documents,
            openModalShown,
            newModalShown,
            editData,
            newDocName,
            alertShown,
            apiLoaded,
            alertContent,
            toastShow,
            username,
        } = this.state;

        if (error) {
            console.log("Error:", error.message);
        }

        return (
            <>
                <Alert variant="primary" show={alertShown} onClose={this.hideAlert} dismissible>
                    {alertContent}
                </Alert>

                <Header
                    editor={true}
                    new={this.showNewModal}
                    open={this.showOpenModal}
                    save={this.saveDocument}
                    print={(e) => this.printEditData(e)}
                    reset={this.resetDB}
                    username={username}
                    logout={this.handleLogout}
                />

                <main className="editor">
                    <Container>
                        <ReactQuill
                            ref={(el) => {
                                this.reactQuillRef = el;
                            }}
                            theme={"snow"}
                            modules={this.modules}
                            formats={this.formats}
                            value={editData}
                            onChange={this.handleChange}
                        />
                    </Container>

                    <ToastContainer position="top-end" className="p-3">
                        <Toast
                            onClose={() => this.setState({ toastShow: false })}
                            show={toastShow}
                            delay={4000}
                            autohide
                        >
                            <Toast.Header>
                                <strong className="me-auto">Notice</strong>
                                <small className="text-muted">just now</small>
                            </Toast.Header>
                            <Toast.Body>The document was saved.</Toast.Body>
                        </Toast>
                    </ToastContainer>

                    <Modal show={openModalShown} onHide={this.hideOpenModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Open Document</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            {!apiLoaded && "Loading..."}
                            {apiLoaded && (
                                <Table striped hover>
                                    <tbody>
                                        {documents.map((document) => (
                                            <tr key={document._id}>
                                                <td>
                                                    <Button
                                                        variant="link"
                                                        value={document._id}
                                                        onClick={(e) => {
                                                            this.openDocument(document._id, e);
                                                            this.hideOpenModal();
                                                        }}
                                                    >
                                                        {document.name} (ID: {document._id})
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            )}
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="primary" onClick={this.hideOpenModal}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal show={newModalShown} onHide={this.hideNewModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Create New Document</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <InputGroup size="lg">
                                <InputGroup.Text id="inputGroup-sizing-lg">Name</InputGroup.Text>
                                <FormControl
                                    aria-label="Large"
                                    aria-describedby="inputGroup-sizing-sm"
                                    onChange={(e) => this.setState({ newDocName: e.target.value })}
                                />
                            </InputGroup>
                            <Dropdown.Divider />
                            <InputGroup>
                                <InputGroup.Text>Other users (comma separated)</InputGroup.Text>
                                <FormControl
                                    as="textarea"
                                    aria-label="Other users (comma separated)"
                                    onChange={(e) => this.handleUsersInput(e.target.value)}
                                />
                            </InputGroup>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="primary"
                                onClick={(e) => {
                                    this.createDocument(newDocName, e);
                                    this.hideNewModal();
                                }}
                            >
                                Save
                            </Button>
                            <Button variant="secondary" onClick={this.hideNewModal}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </main>

                <Footer />
            </>
        );
    }
}

export default Editor;
