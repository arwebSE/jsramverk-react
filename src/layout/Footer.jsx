/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react'
import { Container } from 'react-bootstrap';
import '../styles/footer.scss';
import { FaTwitter, FaInstagram, FaFacebook } from 'react-icons/fa';

export default function Footer() {
    return (
        <footer className="footer">
            <Container>
                <div className="d-flex flex-wrap justify-content-between align-items-center py-3 my-4 border-top">
                    <div className="col-md-4 d-flex align-items-center">
                        <a href="/#home" className="mb-3 me-2 mb-md-0 text-muted text-decoration-none lh-1">
                            <img src="logo.png" width="30" alt="logo" />
                        </a>
                        <span className="logo-text text-muted">© 2021 AuroDocs™</span>
                    </div>

                    <ul className="nav col-md-4 justify-content-end list-unstyled d-flex">
                       
                        <li className="ms-3"><a className="text-muted" href="#"><FaTwitter /></a></li>
                        <li className="ms-3"><a className="text-muted" href="#"><FaInstagram /></a></li>
                        <li className="ms-3"><a className="text-muted" href="#"><FaFacebook /></a></li>
                    </ul>
                </div>
            </Container>
        </footer>
    )
}
