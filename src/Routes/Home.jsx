import React, { Component } from "react";
import {
    Button,
    Container,
    Col,
    Row,
    Card,
    Modal,
    InputGroup,
    FormControl,
    Dropdown,
    Alert,
    Badge,
} from "react-bootstrap";
import Header from "../layout/Header";
import Footer from "../layout/Footer";
import "../styles/home.scss";
import * as auth from "../utils/auth.js";
import * as db from "../utils/db.js";

let apiUrl;
if (process.env.NODE_ENV === "development") {
    console.log("=> Dev Mode!");
    apiUrl = "http://localhost:1337";
} else {
    apiUrl = "https://jsramverk-editor-auro17.azurewebsites.net";
    //apiUrl = "https://jsramverk-api.arwebse.repl.co";
}

export default class Home extends Component {
    constructor(props) {
        super(props);
        this.state = {
            apollo: null,
            apiLoaded: false,
            documents: [],
            username: null,
            inviteModalShown: false,
            invitedUser: null,
            invitedEmail: null,
            selectedDoc: null,
            alertShown: false,
            alertContent: null,
            newModalShown: false,
            allowedUsers: [],
            newDocName: null,
            deleteModalShown: false,
        };
    }

    sendInvite = (e) => {
        e.preventDefault();
        let url = `${apiUrl}/invite?docid=${this.state.selectedDoc}`;
        url += `&user=${this.state.invitedUser}`;
        url += `&email=${this.state.invitedEmail}`;
        console.log("=> Invite sent. GET:", url);
        fetch(url)
            .then((response) => {
                if (response.ok) {
                    return response;
                } else {
                    throw new Error("Something went wrong");
                }
            })
            .then((data) => {
                console.log("<= Successfully sent invite! data:", data);
                this.showAlert("Successfully sent invite!");
            })
            .catch((err) => {
                console.error("Error sending invite!", err);
            });
    };

    listDocs = async () => {
        console.log("=> Calling listUserDocs...");
        let userdocs = await db.listUserDocs(this.state.apollo, this.state.username);
        if (userdocs) {
            this.setState({ documents: userdocs, apiLoaded: true });
        } else {
            console.error("=> Could not get userdocs =(");
            if (await auth.refreshAccessToken()) {
                userdocs = await db.listUserDocs(this.state.apollo, this.state.username);
                console.log("userdocs", userdocs);
                if (userdocs) {
                    this.setState({ documents: userdocs, apiLoaded: true });
                    return true;
                }
                return;
            }
            return;
        }
    };

    showAlert = (content) => {
        this.setState({ alertShown: true, alertContent: content });
    };
    hideAlert = () => {
        this.setState({ alertShown: false });
    };
    showNewModal = () => {
        this.setState({ newModalShown: true });
        this.setState({ allowedUsers: [] }); // reset var
    };
    hideNewModal = () => {
        this.setState({ newModalShown: false });
    };
    showInviteModal = (selectedDoc) => {
        this.setState({ inviteModalShown: true, invitedUser: null, invitedEmail: null, selectedDoc });
    };
    hideInviteModal = () => {
        this.setState({ inviteModalShown: false });
    };
    hideDeleteModal = () => {
        this.setState({ deleteModalShown: false });
    };
    showDeleteModal = (selectedDoc) => {
        this.setState({ deleteModalShown: true, selectedDoc });
    };

    gotoDocument = (docid) => {
        this.props.history.push({ pathname: `/docs/${docid}` });
    };

    initApolloClient = async () => {
        let apollo = await db.initApollo();
        this.setState({ apollo }); // Store apollo ref in state var
    };

    componentDidMount = async () => {
        let loginData = auth.getLogin();
        if (loginData) {
            this.setState({ username: loginData.username });
            await this.initApolloClient();
            await this.listDocs();
        } else {
            // Username is not set
            console.log("Aborting load.");
            this.props.history.push({ pathname: "/login" });
        }
    };

    handleUsersInput = (values) => {
        let arr = values.split(",").map(function (item) {
            return item.trim();
        });
        this.setState({ allowedUsers: arr });
    };

    sleep = (milliseconds) => {
        return new Promise((resolve) => setTimeout(resolve, milliseconds));
    };

    createDocument = async (e = null) => {
        if (e) e.preventDefault();
        if (this.state.username == null) return;

        let users = [this.state.username];
        if (this.state.allowedUsers.length > 0) {
            users = users.concat(this.state.allowedUsers);
        }

        let results = await db.createDocument(this.state.apollo, this.state.newDocName, users);
        if (results) {
            this.showAlert("Successfully created doc!");
            console.log("Successfully created doc with ID:", results);
            this.sleep(5000).then((result) => {
                window.location.reload(false);
            });
        }
        this.hideNewModal();
    };

    deleteDocument = async (e = null) => {
        if (e) e.preventDefault();
        if (this.state.username == null) return;

        let results = await db.deleteDocument(this.state.apollo, this.state.selectedDoc);
        if (results) {
            this.showAlert("Successfully deleted doc!");
            console.log("Successfully deleted document:", results);
            this.sleep(5000).then((result) => {
                window.location.reload(false);
            });
        }
        this.hideNewModal();
    };

    render() {
        const rowWidth = 4;
        const rows = [...Array(Math.ceil(this.state.documents.length / rowWidth))];
        const cardRows = rows.map((_row, index) =>
            this.state.documents.slice(index * rowWidth, index * rowWidth + rowWidth)
        );
        const content = cardRows.map((row, index) => (
            <div className="row" key={index}>
                {row.map((document) => (
                    <Card border="primary" key={document._id} style={{ width: "19rem" }}>
                        <Card.Body>
                            <Card.Subtitle className="mb-2 text-center text-muted">Document</Card.Subtitle>
                            <Card.Title>{document.name}</Card.Title>
                            <Card.Text className="text-muted">
                                Editors:
                                {document.users.map((user) => (
                                    <Badge bg="primary" key={user}>
                                        {user}
                                    </Badge>
                                ))}
                            </Card.Text>
                            <Button variant="outline-primary" size="sm" onClick={() => this.gotoDocument(document._id)}>
                                Open 📂
                            </Button>
                            <span> </span>
                            <Button variant="outline-dark" size="sm" onClick={() => this.showInviteModal(document._id)}>
                                Invite 📧
                            </Button>
                            <span> </span>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => this.showDeleteModal(document._id)}
                            >
                                Delete 🗑
                            </Button>
                        </Card.Body>
                    </Card>
                ))}
            </div>
        ));

        return (
            <>
                <Header showUser={true} username={this.state.username} logout={auth.logout} />

                <Alert variant="primary" show={this.state.alertShown} onClose={this.hideAlert} dismissible>
                    {this.state.alertContent}
                </Alert>

                <main className="home">
                    <Container className="mt-5">
                        <Row>
                            <Col lg={2} md={6} sm={12} className="mt-5 p-3 text-center">
                                <h2 className="text-black-50 mt-4 mb-4">Dashboard</h2>
                                <h5 className="text-black-50">Manage and share your documents.</h5>
                                <hr />
                                <div className="mt-5 pb-4">
                                    <img src="logo.png" alt="logo" width="70" />
                                    <h3 className="text-black-50 logotitle">AuroDocs™</h3>
                                </div>
                            </Col>
                            <Col lg={10} md={6} sm={12}>
                                {!this.state.apiLoaded && "Loading..."}
                                {this.state.apiLoaded && (
                                    <>
                                        <h1>Documents</h1>
                                        {content}
                                        <div className="row">
                                            <Card bg="primary" text="white" style={{ width: "18rem" }}>
                                                <Card.Body>
                                                    <Card.Title>New Document</Card.Title>
                                                    <Button
                                                        variant="light"
                                                        size="sm"
                                                        onClick={(e) => this.showNewModal(e)}
                                                    >
                                                        Create Document 🌟
                                                    </Button>
                                                </Card.Body>
                                            </Card>
                                        </div>
                                    </>
                                )}
                            </Col>
                        </Row>
                    </Container>

                    <Modal show={this.state.inviteModalShown} onHide={this.hideInviteModal}>
                        <Modal.Header closeButton>
                            <Modal.Title>Invite to Edit</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <p className="mb-2 text-muted"> Document: {this.state.selectedDoc}</p>
                            <InputGroup size="lg">
                                <InputGroup.Text id="inputGroup-sizing-lg">Username:</InputGroup.Text>
                                <FormControl
                                    aria-label="Large"
                                    aria-describedby="inputGroup-sizing-sm"
                                    onChange={(e) => this.setState({ invitedUser: e.target.value })}
                                />
                            </InputGroup>
                            <Dropdown.Divider />
                            <InputGroup size="lg">
                                <InputGroup.Text id="inputGroup-sizing-lg">Email:</InputGroup.Text>
                                <FormControl
                                    aria-label="Large"
                                    aria-describedby="inputGroup-sizing-sm"
                                    onChange={(e) => this.setState({ invitedEmail: e.target.value })}
                                />
                            </InputGroup>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="primary"
                                onClick={(e) => {
                                    this.sendInvite(e);
                                    this.hideInviteModal();
                                }}
                            >
                                Send
                            </Button>
                            <Button variant="secondary" onClick={(e) => this.hideInviteModal(e)}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal show={this.state.deleteModalShown} onHide={this.hideDeleteModal} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>Delete Document</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>You sure you want to delete this document?</Modal.Body>
                        <Modal.Footer>
                            <Button
                                variant="danger"
                                onClick={(e) => {
                                    this.deleteDocument(e);
                                    this.hideDeleteModal();
                                }}
                            >
                                Yes, delete
                            </Button>
                            <Button variant="primary" onClick={(e) => this.hideDeleteModal(e)}>
                                No
                            </Button>
                        </Modal.Footer>
                    </Modal>

                    <Modal show={this.state.newModalShown} onHide={this.hideNewModal}>
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
                                    this.createDocument(e);
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
