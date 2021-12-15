import React, { Component } from "react";

import { ListGroup, Button } from "react-bootstrap";

export default class Comments extends Component {
    handleClick = (e, index) => {
        e.preventDefault();
        let data = this.props.content[index];
        this.props.quill.setSelection(data.range.index, data.range.length);
    };

    close = (index) => {
        this.props.deleteComment(index);
    };

    render() {
        let content = this.props.content;
        let listItems;

        if (content) {
            listItems = content.map((value, index) => {
                return (
                    <ListGroup.Item key={index}>
                        <Button className="commentLink" onClick={(e) => this.handleClick(e, index)}>
                            {value.comment}
                        </Button>
                        <Button className="closeComment" variant="danger" onClick={() => this.close(index)}>
                            X
                        </Button>
                    </ListGroup.Item>
                );
            });
        }

        return (
            <div className="comments">
                <h5>Comments</h5>
                <ListGroup horizontal="lg" className="my-2">
                    {listItems}
                </ListGroup>
            </div>
        );
    }
}
