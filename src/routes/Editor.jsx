import React, { Component } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Controlled as ReactCodeMirror } from "react-codemirror2";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/javascript/javascript.js";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import "../styles/editor.scss";
import {
    Modal,
    Button,
    Table,
    InputGroup,
    FormControl,
    Container,
    Alert,
    Dropdown,
    ButtonGroup,
    ToggleButton,
} from "react-bootstrap";
import socketIOClient from "socket.io-client";
import * as queries from "../graphql/queries";
import { saveAs } from "file-saver";
import { pdfExporter } from "quill-to-pdf";
import Comments from "../components/Comments";
import Notification from "../components/Notification";
import * as auth from "../utils/auth.js";
import * as db from "../utils/db.js";

let apiUrl;
if (process.env.NODE_ENV === "development") {
    console.log("=> Dev Mode!");
    apiUrl = "http://localhost:1337";
} else {
    apiUrl = process.env.REACT_APP_API_URL;
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
            editData: "",
            newDocName: null,
            newDocType: "text",
            alertShown: false,
            alertVariant: "primary",
            alertContent: "",
            docid: props.match.params.id,
            userChanged: false,
            toastShow: false,
            toastContent: "",
            username: null,
            accessToken: null,
            refreshToken: null,
            allowedUsers: [],
            apollo: null,
            comments: [],
            showComments: false,
            codeMode: false,
            codeMirror: null, // CodeMirror instance
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

    docTypes = [
        { name: "Text", value: "text" },
        { name: "Code", value: "code" },
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
            if (!this.state.codeMode) {
                this.attachQuillRefs();
                this.quillRef.setText("Loading...");
            }

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
        if (!this.state.codeMode) {
            this.attachQuillRefs();
        }
    }

    /* HELPER FUNCTIONS */

    initApolloClient = async () => {
        let apollo = await db.initApollo(this.state.accessToken);
        this.setState({ apollo }); // Store apollo ref in state var
    };

    setStateAsync(state) {
        return new Promise((resolve) => {
            this.setState(state, resolve);
        });
    }

    docidExists = (docs, docid) => {
        return docs.some(function (el) {
            return el._id === docid;
        });
    };

    handleUsersInput = (values) => {
        let arr = values.split(",").map(function (item) {
            return item.trim();
        });
        this.setState({ allowedUsers: arr });
    };

    attachQuillRefs = () => {
        if (typeof this.reactQuillRef.getEditor !== "function") return;
        this.quillRef = this.reactQuillRef.getEditor();
    };

    checkNull(name, option) {
        const codeMode = this.state.codeMode;
        const codeMirror = this.state.codeMirror;
        const quillRef = this.quillRef;
        const docid = this.state.docid;
        const socket = this.socket;
        if (docid === undefined) {
            console.log(`${name} aborted! docid:${docid}`);
        } else if ((codeMode && codeMirror === null) || (!codeMode && quillRef == null)) {
            console.log(`${name} aborted! codeMode:${codeMode} codeMirror:${codeMirror} quillRef:${quillRef}`);
        } else if (option === "socket" && socket === null) {
            console.log(`${name} aborted! socket:${socket}`);
        } else {
            return true;
        }
        return;
    }

    executeJS = () => {
        let data = { code: btoa(this.state.editData) };

        fetch(`${process.env.REACT_APP_EXEC_URL}`, {
            body: JSON.stringify(data),
            headers: { "content-type": "application/json" },
            method: "POST",
        })
            .then((response) => {
                return response.json();
            })
            .then((result) => {
                let results = atob(result.data);
                console.log("<= Received execJS results:", results);
                this.showAlert(`🧾ExecJS Results: 👉 ${results}`, "success");
            })
            .catch((err) => {
                this.showAlert(`Could not execute! Error: ${err}`, "danger");
            });
    };

    handleAddComment = async (e = null) => {
        if (e) e.preventDefault();
        if (!this.checkNull("AddComment")) return;
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

                    await this.setStateAsync({ comments }); // wait until stored
                    this.setState({ showComments: true });
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
        if (!this.checkNull("PDF")) return;

        const data = this.quillRef.getContents();
        const pdfAsBlob = await pdfExporter.generatePdf(data); // converts to PDF
        saveAs(pdfAsBlob, "pdf-export.pdf"); // downloads from the browser
    };

    changeEditMode = async (e = null) => {
        if (e) e.preventDefault();
        console.log("=> Changed codeMode to:", !this.state.codeMode);
        const codeMode = this.state.codeMode;
        if (codeMode) {
            this.setState({ codeMode: false });
        } else {
            this.setState({ codeMode: true });
        }
    };

    isLoggedIn = async () => {
        console.log("=> Stored username:", localStorage.getItem("username"));
        let loginData = auth.getLogin();
        if (loginData) {
            console.log("=> Logged in as:", loginData.username);
            this.setState({
                username: loginData.username,
                accessToken: loginData.accessToken,
                refreshToken: loginData.refreshToken,
            });
            return true;
        }
        return;
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
        if (userdocs) {
            this.setState({ documents: userdocs, apiLoaded: true });
            this.firstFetch(userdocs); // callback
        } else {
            console.log("=> Trying to refresh token...");

            if (await auth.refreshAccessToken()) {
                userdocs = await db.listUserDocs(this.state.apollo, this.state.username);
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

    receiveChanges() {
        console.log("=> Receive changes called.");
        if (!this.checkNull("ReceiveChanges", "socket")) return;

        console.log("=> Now accepting realtime changes!");
        this.socket.once("receive-changes", (data) => {
            console.log("<= Received changes!", data); // DEBUG
        });
        this.socket.on("receive-changes", (data) => {
            if (this.state.codeMode) {
                this.state.codeMirror.getDoc().setValue(data);
            } else {
                this.quillRef.updateContents(data);
            }
        });
        this.setState({ userChanged: false });
    }

    openDocument = async (docid, e = null) => {
        if (e) e.preventDefault();
        if (!this.checkNull("OpenDocument", "socket")) return;
        if (docid !== this.props.match.params.id) {
            // if on wrong url
            console.log("=> Redirecting to correct url");
            this.props.history.push(`/docs/${docid}`);
        }
        console.log("=> Calling API to send doc:", docid);

        const results = await db.openDocument(this.state.apollo, docid);
        if (!results) {
            console.log("Error opening doc. Aborting.");
        } else if (results === "refresh") {
            console.log("Couldn't open doc. Trying to refresh...");
            auth.refreshAccessToken();
        } else {
            if (results.comments.length > 0) {
                this.setState({ showComments: true, comments: results.comments }); // load comments
            }

            this.setState({ docid, userChanged: false }); // important to ignore changes fetched

            if (results.type === "code") {
                console.log("<= Received doc IS a CODE document!");
                this.setState({ codeMode: true });
                this.setState({ editData: results.data });
                //this.socket.emit("get-document", docid);
                //this.receiveChanges();
                this.autoSave(); // Setup autosave
                this.hideAlert();
            } else {
                console.log("<= Received doc is NOT a code document.", results.data);
                this.quillRef.setContents(results.data, "api");
                this.quillRef.enable();
                this.setState({ editData: this.quillRef.root.innerHTML }); // for print to work without changes made´
                this.socket.emit("get-document", docid);
                this.receiveChanges();
                this.autoSave(); // Setup autosave
                this.hideAlert();
            }
        }
    };

    createDocument = async (name, type, e = null) => {
        if (e) e.preventDefault();
        if (this.state.username == null) return;
        // Add any additional users if given
        let users = [this.state.username];
        if (this.state.allowedUsers.length > 0) {
            users = users.concat(this.state.allowedUsers);
        }

        let results = await db.createDocument(this.state.apollo, name, users, type);
        if (results) {
            this.openDocument(results);
        }
        this.hideNewModal();
    };

    saveDocument = async (e = null) => {
        if (e) e.preventDefault();
        if (this.state.docid === undefined) return;
        let data = "";
        if (this.state.codeMode) {
            if (this.state.codeMirror == null) {
                console.log("=> Couldn't save. cmref:", this.state.codeMirror);
                return;
            }
            data = this.state.codeMirror.doc.getValue();
        } else {
            if (this.quillRef == null) {
                console.log("=> Couldn't save. quillref:", this.quillRef, "docid:", this.state.docid);
                return;
            }

            data = JSON.stringify(this.quillRef.getContents());
        }
        const comments = this.state.comments.map((comment) => (comment = JSON.stringify(comment)));
        console.log("saving:", data, comments, this.state.comments);
        let codeMode = "text";
        if (this.state.codeMode) codeMode = "code";
        const results = await db.saveDocument(this.state.apollo, this.state.docid, data, comments, codeMode);
        if (results) this.setState({ toastShow: true, toastContent: "The document was saved." });
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

    handleCMChange = (editor, data, value) => {
        if (!this.state.codeMode) {
            console.log("=> Error! Can't change. CodeMode:", this.state.codeMode);
            return;
        }
        this.setState({ editData: value, userChanged: true });
        //this.socket.emit("send-changes", value);
        this.timeSinceEdit = Date.now(); // set timer to last edit
    };

    handleQuillChange = (html, delta, source, editor) => {
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
    showAlert = (content, variant = "primary") => {
        this.setState({ alertShown: true, alertContent: content, alertVariant: variant });
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
            codeMode,
            newDocType,
            alertVariant,
        } = this.state;

        if (error) {
            console.log("Error:", error.message);
        }

        return (
            <>
                <Alert variant={alertVariant} show={alertShown} onClose={this.hideAlert} dismissible>
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
                    comment={(e) => this.handleAddComment(e)}
                    changeMode={(e) => this.changeEditMode(e)}
                    codeMode={codeMode}
                    execjs={() => this.executeJS()}
                />

                {showComments ? (
                    <Comments content={comments} quill={this.quillRef} deleteComment={this.deleteComment} />
                ) : null}

                <main className="editor">
                    <Container>
                        {codeMode ? (
                            <ReactCodeMirror
                                options={{
                                    lineWrapping: true,
                                    lint: true,
                                    mode: "javascript",
                                    lineNumbers: true,
                                    theme: "material",
                                }}
                                value={editData}
                                onBeforeChange={(editor, data, value) => this.handleCMChange(editor, data, value)}
                                editorDidMount={(editor) => this.setState({ codeMirror: editor })}
                                className="cmWrapper"
                            />
                        ) : (
                            <ReactQuill
                                ref={(el) => (this.reactQuillRef = el)}
                                theme={"snow"}
                                modules={this.modules}
                                formats={this.formats}
                                value={editData}
                                onChange={this.handleQuillChange}
                            />
                        )}
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
                            <br />
                            <h6 style={{ display: "inline" }}>Document Type: </h6>
                            <ButtonGroup>
                                {this.docTypes.map((radio, idx) => (
                                    <ToggleButton
                                        key={idx}
                                        id={`radio-${idx}`}
                                        type="radio"
                                        variant={idx % 2 ? "outline-success" : "outline-primary"}
                                        name="radio"
                                        value={radio.value}
                                        checked={newDocType === radio.value}
                                        onChange={(e) => this.setState({ newDocType: e.currentTarget.value })}
                                    >
                                        {radio.name}
                                    </ToggleButton>
                                ))}
                            </ButtonGroup>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="primary"
                                onClick={(e) => {
                                    this.createDocument(newDocName, newDocType, e);
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
