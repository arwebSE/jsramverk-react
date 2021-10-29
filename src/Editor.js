import React, { Component } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FaGithub } from 'react-icons/fa';
import { Modal, Button, DropdownButton, Dropdown, Table, InputGroup, FormControl, Nav, Navbar, Container } from 'react-bootstrap';
import socketIOClient from "socket.io-client";

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
        this.refreshList()

        // Attaching socket
        const s = socketIOClient(apiUrl)
        this.setState({ socket: s })

        this.receiveChanges(); // Receive realtime changes to document
        this.openDocument(this.docid); // Open document based off route
        this.autoSave(); // Setup autosave
    }

    componentWillUnmount() {
        this.state.socket.disconnect()
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
        if (this.state.socket == null || this.quillRef == null) { return }
        this.state.socket.on("receive-changes", delta => {
            this.quillRef.updateContents(delta);
        })
    }

    openDocument(docid) {
        if (this.state.socket == null || this.quillRef == null) { return }
        this.state.socket.once("load-document", document => {
            this.quillRef.setContents(document);
            this.quillRef.enable();
        })

        this.state.socket.emit("get-document", docid)
    }

    createDocument(e = null, name) {
        if (e) { e.preventDefault(); }
        if (this.state.socket == null || this.quillRef == null) { return }
        this.state.socket.once("created-document", document => {
            console.log("received created document with name:", document.name);
            console.log("opening newly created doc");
            this.openDocument(document._id)
        })
        console.log("sending request to create doc with name:", name);
        this.state.socket.emit("create-document", this.docid, name)
    }

    autoSave() {
        if (this.state.socket == null || this.quillRef == null) { return }
        const interval = setInterval(() => {
            this.state.socket.emit("save-document", this.quillRef.getContents())
        }, SAVE_INTERVAL)
        return () => {
            clearInterval(interval)
        }
    }

    /* MISC FUNCTIONS */

    printEditData = (e) => {
        e.preventDefault();
        console.log("Data:", this.state.editData)
    }

    handleChange = (html, delta, source, editor) => {
        // Making sure socket and Quill are attached
        if (this.state.socket == null || this.quillRef == null) { return }
        if (source !== "user") { return } // Prevent changes not made by user
        //console.log("Changed data to:", html);
        this.setState({ editData: html });
        this.state.socket.emit("send-changes", delta);
    }

    refreshList() {
        /* fetch(`${apiUrl}/docs/list`)
            .then(res => res.json())
            .then(
                (result) => {
                    this.setState({ apiLoaded: true, documents: result })
                    console.log("API data fethed successfully!");
                },
                (error) => {
                    this.setState({ apiLoaded: true, error })
                    console.log("API fetch error:", error);
                }
            ) */
        console.log("refreshlist invoked");
        if (this.state.socket == null || this.quillRef == null) { return }
        this.state.socket.once("listed-documents", docs => {
            console.log("loaded docs", docs);
            this.setState({ documents: docs })
        })
        console.log("socket n quill not null");
        this.state.socket.emit("list-documents", "asd")
    }

    showOpenModal = () => { this.setState({ openModalShown: true }); this.refreshList() }
    hideOpenModal = () => { this.setState({ openModalShown: false }) }
    showNewModal = () => { this.setState({ newModalShown: true }) }
    hideNewModal = () => { this.setState({ newModalShown: false }) }

    /*  
    createDocument = () => {
        console.log("CREATED:", this.state.newDocName)
        fetch(`${apiUrl}/docs/create`, {
            method: 'POST', // or 'PUT'
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ "name": this.state.newDocName, "content": "" }),
        })
            .then(response => response.json())
            .then(data => {
                console.log('CREATE SUCCESS:', data);
                this.setState({ newModalShown: false })
            })
            .catch((error) => {
                console.error('CREATE ERROR:', error);
            });
    } */

    /* saveContent = () => {
        let editData = this.state.editData;
        console.log("SAVING:", editData)
        if (this.state.selectedDoc) {
            let doc = this.state.selectedDoc
            let docBody = JSON.stringify({ "name": doc.name, "content": editData })
            console.log("doc:", doc, "body:", docBody);

            fetch(`${apiUrl}/docs/update`, {
                method: 'POST', // or 'PUT'
                headers: { 'Content-Type': 'application/json' },
                body: docBody,
            })
                .then(response => response.json())
                .then(data => {
                    console.log('Success:', data);
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        } else {
            console.log("No doc opened!");
            return;
        }
    } */

    resetDB = () => {
        console.log("RESETTING DB")
        fetch(`${apiUrl}/docs/reset`)
            .then(res => res.json())
            .then(
                (result) => {
                    console.log("DB Reset successfully:", result);
                },
                (error) => {
                    console.log("Reset error:", error);
                }
            )
    }

    testSocket = () => {
        console.log("Testing socket...")
        this.state.socket.emit("message", "Testing!!!")
    }

    selectDoc = (e, docid) => {
        e.preventDefault(); // prevents firing before click
        let doc = this.state.documents.find(x => x._id === docid)
        this.setState({ selectedDoc: doc })
        console.log('Selected doc:', doc)
        this.setState({ editData: doc.content })
    }

    getDocContent() {
        let docid = this.state.selectedDoc
        let doc = this.state.documents[docid]
        return doc.content
    }

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
                                    <Dropdown.Item onClick={this.saveContent}>Save</Dropdown.Item>
                                    <Dropdown.Item onClick={this.testSocket}>Test Socket</Dropdown.Item>
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
                        <Table striped hover>
                            {!apiLoaded && "Loading..."}
                            {apiLoaded &&
                                <tbody>{documents.map(item =>
                                    <tr key={item._id}>
                                        <td>
                                            <Button variant="link" value={item._id} onClick={e => this.selectDoc(e, item._id)}>
                                                {item.name} (ID: {item._id})
                                            </Button>
                                        </td>
                                    </tr>)
                                }</tbody>
                            }
                        </Table>
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
                        <Button variant="primary" onClick={(e) => this.createDocument(e, newDocName)}>Save</Button>
                        <Button variant="secondary" onClick={this.hideNewModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}

export default Editor;
