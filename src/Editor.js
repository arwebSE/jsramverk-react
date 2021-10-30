import React, { Component } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FaGithub } from 'react-icons/fa';
import { Modal, Button, DropdownButton, Dropdown, Table, InputGroup, FormControl, Nav, Navbar, Container } from 'react-bootstrap';
import socketIOClient from "socket.io-client";
import { BrowserRouter as Redirect } from 'react-router-dom';

/* const apiUrl = "https://jsramverk-editor-auro17.azurewebsites.net" */
const apiUrl = "http://localhost:1337"
const SAVE_INTERVAL = 2000

class Editor extends Component {
    constructor(props) {
        super(props);
        this.docid = props.match.params.id;
        this.quillRef = null;      // Quill instance
        this.reactQuillRef = null; // ReactQuill component
        this.state = {
            error: null,
            apiLoaded: false,
            documents: [],
            openModalShown: false,
            newModalShown: false,
            selectedDoc: null,
            editData: null,
            newDocName: null,
            socket: null
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
        'header',
        'bold', 'italic', 'underline', 'strike', 'blockquote',
        'list', 'bullet', 'indent',
        'link', 'image'
    ]

    /* COMPONENT LIFECYCLE */

    componentDidMount() {
        // Attaching Quill
        this.attachQuillRefs()

        this.quillRef.disable();
        this.quillRef.setText("Loading...");

        // Refreshing doc list from DB
        this.listDocuments()

        // Attaching socket
        const s = socketIOClient(apiUrl)
        this.setState({ socket: s })

        this.receiveChanges(); // Receive realtime changes to document
        this.openDocument(this.docid); // Open document based off route
        this.autoSave(); // Setup autosave
    }

    componentWillUnmount() {
        if (this.state.socket == null) { return }
        //this.state.socket.removeAllListeners();
        this.state.socket.disconnect();
        console.log("Disconnected from server.");
    }

    componentDidUpdate() {
        this.attachQuillRefs()
    }

    /* HELPER FUNCTIONS */

    attachQuillRefs = () => {
        if (typeof this.reactQuillRef.getEditor !== 'function') return;
        this.quillRef = this.reactQuillRef.getEditor();
    }

    receiveChanges() {
        if (this.state.socket == null || this.quillRef == null) return;
        this.state.socket.on("receive-changes", delta => {
            console.log("client received changes");
            this.quillRef.updateContents(delta);
        })
    }

    openDocument = (docid, e = null) => {
        if (e) e.preventDefault();
        if (this.state.socket == null || this.quillRef == null) return;
        if (docid !== this.props.match.params.id) { // if on wrong url
            console.log("redirecting to correct url");
            this.props.history.push(`/docs/${docid}`)
        }
        this.state.socket.once("load-document", content => {
            console.log("received doc content:", content);
            this.quillRef.setContents(content);
            this.quillRef.enable();
            this.setState({ selectedDoc: docid })
        })
        console.log("requesting to open doc:", docid);
        this.state.socket.emit("get-document", docid)

    }

    createDocument = (name, e = null) => {
        if (e) e.preventDefault();
        if (this.state.socket == null) { return }
        this.state.socket.once("created-document", document => {
            console.log("received created document with name:", document.name);
            console.log("opening newly created doc");
            this.openDocument(document._id)
        })
        console.log("sending request to create doc with name:", name);
        this.state.socket.emit("create-document", this.docid, name)
    }

    saveDocument = (e = null) => {
        if (e) e.preventDefault();
        if (this.state.socket == null || this.quillRef == null) return;
        this.state.socket.emit("save-document", this.quillRef.getContents())
        console.log("Saved! Timestamp:", Date.now(), "static delta:", this.quillRef.getContents());
    }

    autoSave = () => {
        if (this.state.socket == null || this.quillRef == null) return;
        const interval = setInterval(() => {
            this.saveDocument()
            console.log("Autosaved!");
        }, SAVE_INTERVAL)
        return () => {
            clearInterval(interval)
        }
    }

    /* MISC FUNCTIONS */

    printEditData = (e = null) => {
        if (e) e.preventDefault();
        console.log("Data:", this.state.editData)
    }

    handleChange = (html, delta, source, editor) => {
        // Making sure socket and Quill are attached
        if (this.state.socket == null || this.quillRef == null) return;
        if (source !== "user") return; // Prevent changes not made by user
        this.setState({ editData: html });
        console.log("attempting to send changes delta:", delta);
        this.state.socket.on("saved-status", (status) => {
            console.log("received save status:", status)
        })
        this.state.socket.emit("send-changes", delta);
    }

    listDocuments() {
        console.log("refresh list invoked");
        if (this.state.socket == null) return;
        this.state.socket.once("listed-documents", docs => {
            console.log("loaded docs", docs);
            this.setState({ documents: docs, apiLoaded: true })
        })
        console.log("socket n quill not null");
        this.state.socket.emit("list-documents", "asd")
    }

    resetDB = (e = null) => {
        if (e) e.preventDefault();
        console.log("RESET invoked");
        if (this.state.socket == null) return;
        this.state.socket.on("resetdb", () => {
            console.log("successfully reset db!")
        })
        this.state.socket.emit("resetdb")
    }

    /* MODAL TOGGLES */
    showOpenModal = () => { this.setState({ openModalShown: true }); this.listDocuments() }
    hideOpenModal = () => { this.setState({ openModalShown: false }) }
    showNewModal = () => { this.setState({ newModalShown: true }) }
    hideNewModal = () => { this.setState({ newModalShown: false }) }
    /* MODAL TOGGLES END */

    render() {
        const { error, documents, openModalShown, newModalShown, editData, apiLoaded, newDocName } = this.state;

        if (error) {
            console.log("Error:", error.message)
        }

        return (
            <div className="Editor">
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
