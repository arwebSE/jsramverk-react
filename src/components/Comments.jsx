import React, { Component } from "react";

import { ListGroup, Button } from "react-bootstrap";

export default class Comments extends Component {
    handleClick = (e, index) => {
        e.preventDefault();
        console.log("comment link called", index, "e", e);
        let data = this.props.content[index];
        this.props.quill.setSelection(data.range.index, data.range.length);
    };

    render() {
        let data = this.props.content;
        let listItems;
        if (data) {
            listItems = data.map(function (value, index) {
                return (
                    <ListGroup.Item key={index}>
                        <Button className="commentLink" onClick={(e) => this.handleClick(e, index)}>
                            {value.comment}
                        </Button>
                    </ListGroup.Item>
                );
            });
        }

        return (
            <div className="comments">
                <h5>Comments</h5>
                <ListGroup horizontal="lg" className="my-2">{listItems}</ListGroup>
            </div>
        );
    }
}
