import React, { Component } from 'react';
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { FaGithub } from 'react-icons/fa';
import { Modal, Button, DropdownButton, Dropdown, Table, InputGroup, FormControl, Nav, Navbar, Container } from 'react-bootstrap';
import socketIOClient from "socket.io-client";

/* const apiUrl = "https://jsramverk-editor-auro17.azurewebsites.net" */

const apiUrl = "http://localhost:1337"
const socket = socketIOClient(apiUrl);

class Editor extends Component {
    constructor(props) {
        super(props);
        this.state = {
            error: null,
            apiLoaded: false,
            documents: [],
            openModalShown: false,
            newModalShown: false,
            selectedDoc: null,
            editData: null,
            loadData: null,
            newDocName: null
        }
        this.showOpenModal = this.showOpenModal.bind(this)
        this.hideOpenModal = this.hideOpenModal.bind(this)
        this.showNewModal = this.showNewModal.bind(this)
        this.hideNewModal = this.hideNewModal.bind(this)
    }

    refreshList = () => {
        fetch(`${apiUrl}/docs/list`)
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
            )
    }

    componentDidMount() {
        this.refreshList()
    }

    showOpenModal = () => { this.setState({ openModalShown: true }); this.refreshList() }
    hideOpenModal = () => { this.setState({ openModalShown: false }) }
    showNewModal = () => { this.setState({ newModalShown: true }) }
    hideNewModal = () => { this.setState({ newModalShown: false }) }

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
    }

    saveContent = () => {
        console.log("SAVING:", this.state.editData)
        let doc = this.state.selectedDoc
        let docBody = JSON.stringify({ "name": doc.name, "content": this.state.editData })
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
    }

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
        socket.emit("message", "Testing!!!")
    }

    selectDoc = (e, docid) => {
        e.preventDefault(); // prevents firing before click
        let doc = this.state.documents.find(x => x._id === docid)
        this.setState({ selectedDoc: doc })
        console.log('Selected doc:', doc)
        this.setState({ loadData: doc.content })
    }

    getDocContent() {
        let docid = this.state.selectedDoc
        let doc = this.state.documents[docid]
        return doc.content
    }

    render() {
        const { error, documents, openModalShown, newModalShown, loadData, apiLoaded } = this.state;

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
                                <DropdownButton title="View" variant="secondary"> </DropdownButton>
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
                    <CKEditor
                        editor={ClassicEditor}
                        data={loadData}
                        onChange={(event, editor) => { this.setState({ editData: editor.getData() }) }}
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
                        <Button variant="primary" onClick={this.createDocument}>Save</Button>
                        <Button variant="secondary" onClick={this.hideNewModal}>Close</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        )
    }
}

export default Editor;
