import { Button, Container, Col, Row } from 'react-bootstrap';
import logoutImg from '../img/logout.svg';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import '../styles/login.scss';

export default function Logout() {
    return (
        <>
            <Header />

            <main className="logout">
                <Container className="mt-5">
                    <Row>
                        <Col lg={4} md={6} sm={12} className="mt-5 p-3 text-center">
                            <div className="mt-5 pb-4">
                                <img src="logo.png" alt="logo" />
                                <h1 className="logotitle">AuroDocs™</h1>
                            </div>
                            <h2 className="text-black-50 mt-4 mb-4">Logged out...</h2>
                            <h5 className="text-black-50">See you later! =)</h5>
                            <div className="d-grid gap-2">
                                <Button className="mt-2" size="lg" href="#login" variant="primary">Go back to Login</Button>
                            </div>
                        </Col>
                        <Col lg={8} md={6} sm={12}>
                            <img className="w-75" src={logoutImg} alt="background art" />
                        </Col>
                    </Row>
                </Container>
            </main>

            <Footer />
        </>
    )
}
