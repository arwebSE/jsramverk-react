import React from "react";
import "codemirror/lib/codemirror.css";
import "codemirror/theme/material.css";
import "codemirror/mode/javascript/javascript"
import { Controlled as CodeMirror } from "react-codemirror2";

export default function CodeEditor(props) {
    const { value, onChange } = props;

    function handleChange(editor, data, value) {
        onChange(value);
    }

    return (
        <CodeMirror
            value={value}
            options={{
                lineWrapping: true,
                lint: true,
                mode: "javascript",
                lineNumbers: true,
                theme: 'material'
            }}
            onBeforeChange={handleChange}
            className="code-mirror-wrapper"
        />
    );
}
