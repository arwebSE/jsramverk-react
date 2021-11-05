import React from 'react'
import { FaGithub, FaEdit } from 'react-icons/fa';
import { Button, Navbar, Container } from 'react-bootstrap';

export default function Home() {
    return (
        <div>
            <Navbar bg="dark" variant="dark" className="toolbar">
                <Container>
                    <Navbar.Brand href="#" className="justify-content-center">
                        <img src="logo.png" width="30" height="30"
                            className="d-inline-block align-top" alt="AuroDocs logo"
                        /> AuroDocs™
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />
                    <div className="justify-content-end">
                        <Button variant="success" href="https://github.com/arwebSE/jsramverk-react">GitHub <FaGithub /></Button>
                    </div>
                </Container>
            </Navbar>

            <Container>
                <div>
                    <h1>Home Page! =)</h1>
                    <Button variant="primary" href="#docs">Link to Docs <FaEdit /></Button>
                </div>
            </Container>

        </div>
    )
}
