/* eslint-disable jsx-a11y/anchor-is-valid */
import { Col, Container, Row, Button, Navbar } from 'react-bootstrap';
import { FaGithub } from 'react-icons/fa';
import '../styles/login.scss';
import successImg from '../img/success.svg';

export default function Success() {

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

            <Container className="mt-5">
                <Row>
                    <Col lg={4} md={6} sm={12} className="mt-5 p-3 text-center">
                        <div className="mt-5 pb-5">
                            <img src="logo.png" alt="logo" />
                            <h1 className="logotitle">AuroDocs™</h1>
                        </div>
                        <h2 className=" text-black-50 mt-5 mb-5">Successfully registered!</h2>
                        <div className="d-grid gap-2">
                            <Button className="mt-5" size="lg" href="#login" variant="primary">Go to Login</Button>
                        </div>
                    </Col>
                    <Col lg={8} md={6} sm={12}>
                        <img className="w-100" src={successImg} alt="background art" />
                    </Col>
                </Row>
            </Container>
        </div>
    )
}
