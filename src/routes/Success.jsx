import { Col, Container, Row, Button } from 'react-bootstrap';
import successImg from '../img/success.svg';
import Header from '../layout/Header';
import Footer from '../layout/Footer';
import '../styles/login.scss';

export default function Success() {
    return (
        <>
            <Header />

            <main className="success">
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
            </main>

            <Footer />
        </>
    )
}
