import React, { Component } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FaGithub } from 'react-icons/fa';
import { Modal, Button, DropdownButton, Dropdown, Table, InputGroup, FormControl, Nav, Navbar, Container, Alert } from 'react-bootstrap';
import socketIOClient from "socket.io-client";

/* const apiUrl = "https://jsramverk-editor-auro17.azurewebsites.net" */
const apiUrl = "http://localhost:1337"
const SAVE_INTERVAL = 5000

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
            alertContent: ""
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

    componentDidMount() {
        // Attaching Quill
        this.attachQuillRefs()

        //this.quillRef.disable();
        this.quillRef.setText("Loading...");

        // Attaching socket
        const sock = socketIOClient(apiUrl);
        this.socket = sock;

        // Refreshing doc list from DB
        this.listDocuments()

        let docExists = this.docidExists();

        console.log("=> Mounted with docid:", this.state.docid);
        if (this.state.docid === undefined) {
            console.log("=> No docid in URL / no doc opened.");
            this.showAlert("Please open or create a document.");
        } else if (docExists) {
            console.log("=> docid is defined!");
            this.openDocument(this.state.docid); // Open document based off route
        } else {
            console.log("=> document doesnt exist!");
            this.showAlert("The document doesnt exist!");
        }
    }

    componentWillUnmount() {
        if (this.socket !== null) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            console.log("=> Disconnected from server.");
        }
        if (this.interval) {
            clearInterval(this.interval);
        }
    }

    componentDidUpdate() {
        this.attachQuillRefs()
    }

    /* HELPER FUNCTIONS */

    docidExists = () => {
        console.log("=> docidExists called! =)");
        return this.state.documents.some(function (el) {
            console.log("=> el._id=", el._id, "this.state.docid=", this.state.docid);
            return el._id === this.state.docid;
        });
    }

    attachQuillRefs = () => {
        if (typeof this.reactQuillRef.getEditor !== 'function') return;
        this.quillRef = this.reactQuillRef.getEditor();
    }

    receiveChanges() {
        console.log("=> receive changes called");
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
        this.socket.on("load-document", document => {
            console.log("<= Received init content:", document.data);
            this.setState({ docid: docid, userChanged: false }) // important to ignore changes fetched
            this.quillRef.setContents(document.data, 'api');
            this.quillRef.enable();
        })
        console.log("=> requesting to open doc:", docid);
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
            console.log("<= received save status:", status)
        })
        this.socket.emit("save-document", this.state.docid, this.quillRef.getContents())
        console.log("=> Saved! data:", this.quillRef.getContents());
    }

    autoSave = () => {
        if (this.socket == null || this.quillRef == null) return;

        this.interval = setInterval(() => {
            const elapsed = Date.now() - this.timeSinceEdit;
            if (this.state.userChanged) {
                console.log("=> has changed");
                if (elapsed > SAVE_INTERVAL) {
                    console.log('=> autosaving...');
                    this.saveDocument();
                    this.setState({ userChanged: false });
                }
            } else {
                console.log("=> has not changed");
            }
        }, SAVE_INTERVAL)
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

    listDocuments() {
        if (this.socket == null) return;
        console.log("=> Listing docs...");
        this.socket.on("listed-documents", docs => {
            console.log("<= Received docs:", docs);
            this.setState({ documents: docs, apiLoaded: true })
        })
        this.socket.emit("list-documents")
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
        const { error, documents, openModalShown, newModalShown, editData, newDocName, alertShown, apiLoaded, alertContent } = this.state;

        if (error) { console.log("Error:", error.message) }

        return (
            <div className="Editor">
                <Alert variant="primary" show={alertShown} onClose={this.hideAlert} dismissible>
                    {alertContent}
                </Alert>

                <Navbar bg="dark" variant="dark" className="toolbar">
                    <Container>
                        <Navbar.Brand href="#home" className="justify-content-center">
                            <img src="logo.png" width="30" height="30"
                                className="d-inline-block align-top" alt="AuroDocs logo"
                            /> AuroDocs™
                        </Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" />
                        <Navbar.Collapse id="basic-navbar-nav">
                            <Nav className="me-auto">
                                <DropdownButton title="File">
                                    <Dropdown.Item onClick={this.showNewModal}>New</Dropdown.Item>
                                    <Dropdown.Item onClick={this.showOpenModal}>Open...</Dropdown.Item>
                                    <Dropdown.Item onClick={this.saveDocument}>Save</Dropdown.Item>
                                </DropdownButton>
                                <DropdownButton title="Edit" variant="secondary"> </DropdownButton>
                                <DropdownButton title="View" variant="secondary">
                                    <Dropdown.Item onClick={e => this.printEditData(e)}>Print content to Console</Dropdown.Item>
                                </DropdownButton>
                                <DropdownButton title="Help" variant="info">
                                    <Dropdown.Item onClick={this.resetDB}>Reset Database</Dropdown.Item>
                                </DropdownButton>
                            </Nav>
                        </Navbar.Collapse>

                        <div className="justify-content-end">
                            <Button variant="success" href="https://github.com/arwebSE/jsramverk-react">GitHub <FaGithub /></Button>
                        </div>
                    </Container>
                </Navbar>

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
            </div>
        )
    }
}

export default Editor;
