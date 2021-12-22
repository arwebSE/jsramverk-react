import React, { Component } from "react";
import ReactQuill from "react-quill";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import "react-quill/dist/quill.snow.css";
import "../styles/editor.scss";
import { Modal, Button, Table, InputGroup, FormControl, Container, Alert, Dropdown } from "react-bootstrap";
import socketIOClient from "socket.io-client";
import * as queries from "../graphql/queries";
import { saveAs } from "file-saver";
import { pdfExporter } from "quill-to-pdf";
import Comments from "../components/Comments";
import Notification from "../components/Notification";
import * as auth from "../utils/auth.js";
import * as db from "../utils/db.js";

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
const TOKEN_INTERVAL = 250000; // 300k = 5min

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
            comments: [],
            showComments: true,
            toastContent: "",
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

    componentDidMount = async () => {
        // Handle username with storage
        if (await this.isLoggedIn()) {
            // Setup auto refresh access token
            this.autoRefreshToken();

            // init gql client
            await this.initApolloClient();

            console.log("=> Connecting to API at:", apiUrl);

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
    };

    componentWillUnmount() {
        if (this.socket !== null) {
            this.socket.disconnect();
            console.log("=> Disconnected from server.");
            this.socket.removeAllListeners();
            console.log("=> Removed all socket listeners.");
            document.removeEventListener("keydown", this.saveKeysHandler); // removes ctrl+s listener
        }
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

    initApolloClient = async () => {
        let apollo = await db.initApollo(this.state.accessToken);
        this.setState({ apollo }); // Store apollo ref in state var
    };

    handleComment = (e = null) => {
        if (e) e.preventDefault();
        if (this.quillRef == null || this.state.docid === undefined) {
            console.log("=> Comment: Couldn't make comment. quillref:", this.quillRef, "docid:", this.state.docid);
            return;
        }
        let prompt = window.prompt("Enter comment text:", "");
        let comments = [];
        if (prompt == null || prompt === "") {
            console.log("=> Comment: Cancelled prompt.");
        } else {
            let selection = this.quillRef.getSelection(true); // focus = true
            if (selection) {
                if (selection.length === 0) {
                    console.log("=> Comment: Selection length 0:", selection.index);
                    this.showAlert("Please select text first.");
                } else {
                    let text = this.quillRef.getText(selection.index, selection.length);
                    console.log("=> Comment: Text selected:", text);

                    comments.push({ range: selection, comment: prompt });

                    this.quillRef.formatText(selection.index, selection.length, { background: "#fff72b" });

                    // if not the first comment, add previous comments to new array
                    if (this.state.comments !== null) {
                        comments = this.state.comments.concat(comments);
                    }

                    this.setState({ comments }); // save changes to state
                    this.saveDocument();
                }
            } else {
                this.showAlert("Cursor was not in editor!"); // shouldn't ever happen anymore
            }
        }
    };

    deleteComment = (index) => {
        if (this.state.comments === []) {
            console.log("=> Couldn't delete comment.");
            return;
        }
        let comments = this.state.comments;
        const selection = comments[index];
        this.quillRef.formatText(selection.range.index, selection.range.length, { background: false }); // clear formatting
        comments.splice(index, 1); // remove comment
        this.setState({ comments }); // save changes to state
        this.saveDocument();
    };

    handlePDF = async (e = null) => {
        if (e) e.preventDefault();
        if (this.quillRef == null || this.state.docid === undefined) {
            console.log("=> Couldn't make PDF. quillref:", this.quillRef, "docid:", this.state.docid);
            return;
        }
        const delta = this.quillRef.getContents();
        const pdfAsBlob = await pdfExporter.generatePdf(delta); // converts to PDF
        saveAs(pdfAsBlob, "pdf-export.pdf"); // downloads from the browser
    };

    handleUsersInput = (values) => {
        let arr = values.split(",").map(function (item) {
            return item.trim();
        });
        this.setState({ allowedUsers: arr });
    };

    isLoggedIn = async () => {
        console.log("=> Stored username:", localStorage.getItem("username"));
        let loginData = auth.getLogin();
        if (loginData) {
            console.log("Logged in as:", loginData.username);
            this.setState({
                username: loginData.username,
                accessToken: loginData.accessToken,
                refreshToken: loginData.refreshToken,
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
        console.log("=> Calling listUserDocs...");
        let userdocs = await db.listUserDocs(this.state.apollo, this.state.username);
        console.log("userdocs", userdocs);
        if (userdocs) {
            this.setState({ documents: userdocs, apiLoaded: true });
            this.firstFetch(userdocs); // callback
        } else {
            console.log("=> Trying to refresh token...");

            if (await auth.refreshAccessToken()) {
                userdocs = await db.listUserDocs(this.state.apollo, this.state.username);
                console.log("userdocs", userdocs);
                if (userdocs) {
                    this.setState({ documents: userdocs, apiLoaded: true });
                    this.firstFetch(userdocs); // callback
                    return true;
                }
                return;
            }
            return;
        }
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
                let comments = result.data.openDoc.comments;
                console.log("<= Response to openDoc query:", result);
                if (data === null) {
                    data = "";
                    console.log("<= Fetched document is empty.");
                } else {
                    console.log("<= Received initial content:", data);
                }

                if (comments === null) {
                    comments = [];
                    console.log("<= No stored comments received.");
                } else {
                    comments = comments.map((comment) => (comment = JSON.parse(comment)));
                    console.log("<= Received comments:", comments);
                }

                // load comments
                this.setState({ comments });

                this.setState({ docid, userChanged: false }); // important to ignore changes fetched
                this.quillRef.setContents(data, "api");
                this.quillRef.enable();

                this.setState({ editData: this.quillRef.root.innerHTML }); // for print to work without changes made

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

    createDocument = async (name, e = null) => {
        if (e) e.preventDefault();
        if (this.state.username == null) return;
        // Add any additional users if given
        let users = [this.state.username];
        if (this.state.allowedUsers.length > 0) {
            users = users.concat(this.state.allowedUsers);
        }

        let results = await db.createDocument(this.state.apollo, name, users);
        if (results) {
            this.openDocument(results);
        }
        this.hideNewModal();
    };

    saveDocument = (e = null) => {
        if (e) e.preventDefault();
        if (this.quillRef == null || this.state.docid === undefined) {
            console.log("=> Couldn't save. quillref:", this.quillRef, "docid:", this.state.docid);
            return;
        }

        const data = JSON.stringify(this.quillRef.getContents());
        const comments = this.state.comments.map((comment) => (comment = JSON.stringify(comment)));
        this.state.apollo
            .mutate({
                mutation: queries.UPDATE_DOCUMENT,
                variables: { docid: this.state.docid, data, comments },
            })
            .then((result) => {
                console.log("=> Saved! data:", this.quillRef.getContents(), "comments:", this.state.comments);
                this.setState({ toastShow: true, toastContent: "The document was saved." });
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
            await auth.refreshAccessToken();
        }, TOKEN_INTERVAL);
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
            showComments,
            comments,
            toastContent,
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
                    showUser={true}
                    editor={true}
                    new={this.showNewModal}
                    open={this.showOpenModal}
                    save={this.saveDocument}
                    print={(e) => this.printEditData(e)}
                    reset={this.resetDB}
                    username={username}
                    logout={auth.logout}
                    pdf={(e) => this.handlePDF(e)}
                    comment={(e) => this.handleComment(e)}
                />

                {showComments ? (
                    <Comments content={comments} quill={this.quillRef} deleteComment={this.deleteComment} />
                ) : null}

                <main className="editor">
                    <Container>
                        <ReactQuill
                            ref={(el) => (this.reactQuillRef = el)}
                            theme={"snow"}
                            modules={this.modules}
                            formats={this.formats}
                            value={editData}
                            onChange={this.handleChange}
                        />
                    </Container>

                    <Notification
                        content={toastContent}
                        toastShow={toastShow}
                        toastClose={() => this.setState({ toastShow: false })}
                    />

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
