import { render, screen } from "@testing-library/react";
import Editor from "../routes/Editor";
import Start from "../routes/Start";
import Login from "../routes/Login";
import Logout from "../routes/Logout";
import Register from "../routes/Register";
import Success from "../routes/Success";
import Home from "../routes/Home";

import Header from "../layout/Header";
import Footer from "../layout/Footer";

import Comments from "../components/Comments";
import Modals from "../components/Modals";
import Notification from "../components/Notification";

test("render header", () => {
    render(<Header />);
    const linkElement = screen.getByText(/AuroDocs/i);
    expect(linkElement).toBeInTheDocument();
});

test("render footer", () => {
    render(<Footer />);
    const linkElement = screen.getByText(/AuroDocs™/i);
    expect(linkElement).toBeInTheDocument();
});

test("render start", () => {
    render(<Start />);
    const linkElement = screen.getByText(/Welcome!/i);
    expect(linkElement).toBeInTheDocument();
});

test("render login", () => {
    render(<Login />);
    const linkElement = screen.getByText(/Login To Your Account/i);
    expect(linkElement).toBeInTheDocument();
});

test("render logout", () => {
    render(<Logout />);
    const linkElement = screen.getByText(/Logged out.../i);
    expect(linkElement).toBeInTheDocument();
});

test("render register", () => {
    render(<Register />);
    const linkElement = screen.getByText(/Register New Account/i);
    expect(linkElement).toBeInTheDocument();
});

test("render success", () => {
    render(<Success />);
    const linkElement = screen.getByText(/Successfully registered!/i);
    expect(linkElement).toBeInTheDocument();
});

/* test('test render home', () => {
    render(<Home />);
    const linkElement = screen.getByText(/Start by logging in.../i);
    expect(linkElement).toBeInTheDocument();
}); */

/* test('test render editor', () => {
    render(<Editor />);
    const linkElement = screen.getByText(/Start by logging in.../i);
    expect(linkElement).toBeInTheDocument();
}); */

test("render comments", () => {
    render(
        <Comments
            content={[
                { range: {}, comment: "comment1" },
                { range: {}, comment: "comment2" },
            ]}
        />
    );
    const linkElement = screen.getByText(/comment2/i);
    expect(linkElement).toBeInTheDocument();
});

test("render modals (new document)", () => {
    render(<Modals modal="new" show={true} />);
    const linkElement = screen.getByText(/Create New Document/i);
    expect(linkElement).toBeInTheDocument();
});

test("render notifications", () => {
    render(<Notification content={"testcontent"} toastShow={true} />);
    const linkElement = screen.getByText(/testcontent/i);
    expect(linkElement).toBeInTheDocument();
});
