import React from 'react'
import { Container, Button, Navbar, Nav, DropdownButton, Dropdown, NavDropdown } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';
import '../styles/header.scss';

export default function Header(props) {

    return (
        <header className="header">
            <Navbar bg="dark" variant="dark" className="toolbar">
                <Container>
                    <Navbar.Brand href="#" className="justify-content-center">
                        <img src="logo.png" width="30" height="30"
                            className="d-inline-block align-top" alt="AuroDocs logo"
                        /> AuroDocs™
                    </Navbar.Brand>
                    <Navbar.Toggle aria-controls="basic-navbar-nav" />

                    <Navbar.Collapse>
                        <Nav className="me-auto">
                            {props.editor &&
                                <>
                                    <DropdownButton title="File">
                                        <Dropdown.Item onClick={props.new}>New</Dropdown.Item>
                                        <Dropdown.Item onClick={props.open}>Open...</Dropdown.Item>
                                        <Dropdown.Item onClick={props.save}>Save</Dropdown.Item>
                                    </DropdownButton>
                                    <DropdownButton title="Edit" variant="secondary"> </DropdownButton>
                                    <DropdownButton title="View" variant="secondary">
                                        <Dropdown.Item onClick={props.print}>Print content to Console</Dropdown.Item>
                                    </DropdownButton>
                                    <DropdownButton title="Help" variant="info">
                                        <Dropdown.Item onClick={props.reset}>Reset Database</Dropdown.Item>
                                    </DropdownButton>
                                </>
                            }
                        </Nav>
                    </Navbar.Collapse>

                    <Navbar.Collapse className="justify-content-end">
                        {props.editor &&
                            <NavDropdown title={`Signed in as: ${props.username}`}>
                                <NavDropdown.Item onClick={props.logout}>Logout</NavDropdown.Item>
                            </NavDropdown>
                        }
                        <Button variant="dark" href="https://github.com/arwebSE/jsramverk-react">GitHub <FaGithub /></Button>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </header>
    )
}
