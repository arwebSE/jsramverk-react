import './App.css';

import { BrowserRouter as Router, Route } from 'react-router-dom';
import Editor from './Components/Editor';

function App() {
    return (
        <div className="App">
            {/* <Router>
                <Route exact path="/" component={Editor} />
            </Router> */}
            <Editor />
        </div>
    );
}

export default App;
