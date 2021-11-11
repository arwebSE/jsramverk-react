import React, { Component } from 'react';
import ReactQuill from 'react-quill';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import 'react-quill/dist/quill.snow.css';
import '../styles/editor.scss';
import { Modal, Button, Table, InputGroup, FormControl, Container, Alert, ToastContainer, Toast } from 'react-bootstrap';
import socketIOClient from "socket.io-client";
require("dotenv").config()

let apiUrl;
if (process.env.NODE_ENV === "development") {
    console.log("Dev Mode!");
    apiUrl = "http://localhost:1337";
} else {
    apiUrl = "https://jsramverk-editor-auro17.azurewebsites.net";
}
const SAVE_INTERVAL = 10000

class Editor extends Component {
    constructor(props) {
        super(props);
        this.quillRef = null;      // Quill instance
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
            toastShow: false
        }
    }

    modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, false] }],
            [{ 'font': [] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }, { 'indent': '-1' }, { 'indent': '+1' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': "sub" }, { 'script': "super" }],
            [{ 'align': [] }],
            ['image', 'link', "blockquote", "code-block"],
            ['clean']
        ],
    }

    formats = [
        'header', 'background', 'font', 'color', 'align', 'code-block', 'script',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ]

    /* COMPONENT LIFECYCLE */

    async componentDidMount() {
        console.log("=> Connecting to API at:", apiUrl);

        // Attaching Quill
        this.attachQuillRefs()

        //this.quillRef.disable();
        this.quillRef.setText("Loading...");

        // Attaching socket
        const sock = socketIOClient(apiUrl);
        this.socket = sock;

        // Refreshing doc list from DB
        this.firstFetch()
    }

    componentWillUnmount() {
        if (this.socket !== null) {
            this.socket.disconnect();
            console.log("=> Disconnected from server.");
            this.socket.removeAllListeners();
            console.log("=> Removed all socket listeners.");
            document.removeEventListener("keydown", this.saveKeysHandler); // removes ctrl+s listener
        }
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    componentDidUpdate() {
        this.attachQuillRefs()
    }

    /* HELPER FUNCTIONS */

    docidExists = (docs, docid) => {
        return docs.some(function (el) {
            return el._id === docid;
        });
    }

    firstFetch = async () => {
        this.socket.emit("list-documents")
        await new Promise(resolve => {
            this.socket.once("list-documents", docs => { resolve(docs); });
        }).then((docs) => {
            console.log("<= Received docs:", docs);
            this.setState({ documents: docs, apiLoaded: true })
            let docExists = this.docidExists(docs, this.state.docid);
            if (this.state.docid === undefined) {
                console.log("=> No docid in URL / no doc opened.");
                this.showAlert("Please open or create a document.");
            } else if (docExists) {
                console.log("=> Document exists! Opening...");
                this.openDocument(this.state.docid); // Open document based off route
                document.addEventListener("keydown", this.saveKeysHandler);
            } else {
                console.log("=> document doesnt exist!");
                this.showAlert("The document doesnt exist!");
            }
        })
    }

    listDocuments() {
        this.socket.once("listed-documents", docs => {
            console.log("<= Received docs:", docs);
            this.setState({ documents: docs, apiLoaded: true })
        })
        this.socket.emit("list-documents")
    }

    attachQuillRefs = () => {
        if (typeof this.reactQuillRef.getEditor !== 'function') return;
        this.quillRef = this.reactQuillRef.getEditor();
    }

    receiveChanges() {
        console.log("=> Now accepting realtime changes!");
        if (this.socket == null || this.quillRef == null) return;
        this.socket.once("receive-changes", (delta) => { // DEBUG
            console.log("<= Received changes!", delta);
        })
        this.socket.on("receive-changes", delta => {
            this.quillRef.updateContents(delta);
        })
        this.setState({ userChanged: false });
    }

    openDocument = (docid, e = null) => {
        if (e) e.preventDefault();
        if (this.socket == null || this.quillRef == null) {
            console.log("=> socket:", this.socket, "quillref:", this.quillRef);
            return;
        }
        if (docid !== this.props.match.params.id) { // if on wrong url
            console.log("=> redirecting to correct url");
            this.props.history.push(`/docs/${docid}`)
        }
        this.socket.once("load-document", document => {
            console.log("<= Received initial content:", document.data);
            this.setState({ docid: docid, userChanged: false }) // important to ignore changes fetched
            this.quillRef.setContents(document.data, 'api');
            this.quillRef.enable();
        })
        console.log("=> Calling API to send doc:", docid);
        this.socket.emit("get-document", docid)
        this.receiveChanges();
        this.autoSave(); // Setup autosave
        this.hideAlert();
    }

    createDocument = (name, e = null) => {
        if (e) e.preventDefault();
        if (this.socket == null) { return }
        this.socket.on("created-document", document => {
            console.log("<= received created document with name:", document.name, "id:", document._id);
            console.log("<= opening it...");
            this.openDocument(document._id)
        })
        console.log("=> sending request to create doc with name:", name);
        this.socket.emit("create-document", name)
    }

    saveDocument = (e = null) => {
        if (e) e.preventDefault();
        if (this.socket == null || this.quillRef == null || this.state.docid === undefined) {
            console.log("=> couldnt save. sock:", this.socket, "quillref:", this.quillRef, "docid:", this.state.docid);
            return;
        }
        this.socket.once("saved-status", (status) => {
            console.log("<= Received save status:", status)
        })
        this.socket.emit("save-document", this.state.docid, this.quillRef.getContents())
        console.log("=> Saved! data:", this.quillRef.getContents());
        this.setState({ toastShow: true });
    }

    autoSave = () => {
        if (this.socket == null || this.quillRef == null) return;

        this.interval = setInterval(() => {
            const elapsed = Date.now() - this.timeSinceEdit;
            if (this.state.userChanged) {
                console.log("=> User has edited! Going to autosave...");
                if (elapsed > SAVE_INTERVAL) {
                    console.log('=> AUTOSAVED!');
                    this.saveDocument();
                    this.setState({ userChanged: false }); // resetting var
                }
            } else {
                console.log("=> Skipping autosave (user hasn't edited)...");
            }
        }, SAVE_INTERVAL)
    }

    saveKeysHandler = (e) => {
        if (e.key === "s" && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) {
            e.preventDefault();
            this.saveDocument();
        }
    }

    /* MISC FUNCTIONS */

    printEditData = (e = null) => {
        if (e) e.preventDefault();
        console.log("Data:", this.state.editData)
    }

    handleChange = (html, delta, source, editor) => {
        // Making sure socket and Quill are attached
        if (this.socket == null || this.quillRef == null) return;
        if (source !== "user") return; // Prevent changes not made by user
        this.setState({ editData: html, userChanged: true });
        // console.log("Sending changes:", delta); // DEBUG
        this.socket.emit("send-changes", delta);
        this.timeSinceEdit = Date.now(); // set timer to last edit
    }

    resetDB = (e = null) => {
        if (e) e.preventDefault();
        if (this.socket == null) return;
        this.socket.on("resetdb", () => {
            console.log("<= DB reset OK!")
        })
        console.log("=> Sending reset request...");
        this.socket.emit("resetdb")
    }

    /* TOGGLES */
    showOpenModal = () => { this.listDocuments(); this.setState({ openModalShown: true }); }
    hideOpenModal = () => { this.setState({ openModalShown: false }) }
    showNewModal = () => { this.setState({ newModalShown: true }) }
    hideNewModal = () => { this.setState({ newModalShown: false }) }
    showAlert = (content) => { this.setState({ alertShown: true, alertContent: content }) }
    hideAlert = () => { this.setState({ alertShown: false }) }
    /* TOGGLES END */

    render() {
        const { error, documents, openModalShown, newModalShown, editData, newDocName, alertShown, apiLoaded, alertContent, toastShow } = this.state;

        if (error) { console.log("Error:", error.message) }

        return (
            <>
                <Alert variant="primary" show={alertShown} onClose={this.hideAlert} dismissible>
                    {alertContent}
                </Alert>

                <Header editor={true}
                    new={this.showNewModal}
                    open={this.showOpenModal}
                    save={this.saveDocument}
                    print={e => this.printEditData(e)}
                    reset={this.resetDB}
                />

                <main className="editor">
                    <Container>
                        <ReactQuill
                            ref={(el) => { this.reactQuillRef = el }}
                            theme={'snow'}
                            modules={this.modules}
                            formats={this.formats}
                            value={editData}
                            onChange={this.handleChange}
                        />
                    </Container>

                    <ToastContainer position="top-end" className="p-3">
                        <Toast onClose={() => this.setState({ toastShow: false })} show={toastShow} delay={4000} autohide>
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
                            {apiLoaded &&
                                <Table striped hover>
                                    <tbody>{documents.map(document =>
                                        <tr key={document._id}>
                                            <td>
                                                <Button variant="link" value={document._id} onClick={e => { this.openDocument(document._id, e); this.hideOpenModal(); }}>
                                                    {document.name} (ID: {document._id})
                                                </Button>
                                            </td>
                                        </tr>)
                                    }</tbody>
                                </Table>
                            }
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="primary" onClick={this.hideOpenModal}>Close</Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal show={newModalShown} onHide={this.hideNewModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Create New Document</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <InputGroup size="lg">
                                <InputGroup.Text id="inputGroup-sizing-lg">Name</InputGroup.Text>
                                <FormControl aria-label="Large" aria-describedby="inputGroup-sizing-sm" onChange={(e) => this.setState({ newDocName: e.target.value })} />
                            </InputGroup>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="primary" onClick={(e) => { this.createDocument(newDocName, e); this.hideNewModal(); }}>Save</Button>
                            <Button variant="secondary" onClick={this.hideNewModal}>Close</Button>
                        </Modal.Footer>
                    </Modal>
                </main>

                <Footer />
            </>
        )
    }
}

export default Editor;
